import { createClient } from 'npm:@supabase/supabase-js@2';
import { bridgeTable, validateRows, validateSelect } from './validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-bridge-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Whitelist de operações permitidas. Adicione tabelas/colunas conforme necessário.
const ALLOWED = {
  bairro_airbnb_sp: {
    select: true,
    insert: true,
    update: false,
    delete: false,
  },
  raw_listings: {
    select: true,
    insert: true,
    update: false,
    delete: false,
  },
} as const;

type TableName = keyof typeof ALLOWED;
type Op = 'select' | 'insert' | 'update' | 'delete';

interface BridgeRequest {
  op: Op;
  table: string;
  rows?: Record<string, unknown>[]; // insert
  filters?: Record<string, unknown>; // select equality filters
  columns?: string;                  // select columns
  limit?: number;                    // select limit (max 500)
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const expected = Deno.env.get('CLAUDE_BRIDGE_TOKEN');
  if (!expected) return json({ error: 'Bridge token not configured' }, 500);

  const provided =
    req.headers.get('x-bridge-token') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!provided || provided !== expected) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let payload: BridgeRequest;
  try {
    payload = await req.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return json({ error: 'Invalid request' }, 400);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { op, table } = payload;
  if (!op || !table) return json({ error: 'Missing op or table' }, 400);

  if (!bridgeTable(table)) return json({ error: 'Table not allowed' }, 403);
  const tableConfig = ALLOWED[table];
  if (!Object.hasOwn(tableConfig, op) || !tableConfig[op]) return json({ error: 'Operation not allowed' }, 403);

  let rows: Record<string, unknown>[] = [];
  let selection: ReturnType<typeof validateSelect> | undefined;
  try {
    if (op === 'insert') rows = validateRows(table, payload.rows);
    else selection = validateSelect(table, payload as unknown as Record<string, unknown>);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Invalid input' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const started = Date.now();
  console.log(`[claude-bridge] op=${op} table=${table}`);

  try {
    if (op === 'select' && selection) {
      let q = supabase.from(table).select(selection.columns);
      for (const [k, v] of Object.entries(selection.filters)) q = q.eq(k, v as never);
      const { data, error, count } = await q.limit(selection.limit);
      if (error) return json({ error: error.message }, 400);
      console.log(`[claude-bridge] ok select rows=${data?.length ?? 0} ms=${Date.now() - started}`);
      return json({ data, count });
    }

    if (op === 'insert') {
      const { data, error } = await supabase.from(table).insert(rows).select();
      if (error) return json({ error: error.message }, 400);
      console.log(`[claude-bridge] ok insert rows=${data?.length ?? 0} ms=${Date.now() - started}`);
      return json({ data, inserted: data?.length ?? 0 });
    }

    return json({ error: `Op '${op}' not implemented` }, 400);
  } catch (e) {
    console.error('[claude-bridge] error', e);
    return json({ error: (e as Error).message }, 500);
  }
});
