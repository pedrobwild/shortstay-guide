import { createClient } from 'npm:@supabase/supabase-js@2';

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
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { op, table } = payload;
  if (!op || !table) return json({ error: 'Missing op or table' }, 400);

  const tableConfig = (ALLOWED as Record<string, Record<Op, boolean>>)[table];
  if (!tableConfig) return json({ error: `Table not allowed: ${table}` }, 403);
  if (!tableConfig[op]) return json({ error: `Operation '${op}' not allowed on '${table}'` }, 403);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const started = Date.now();
  console.log(`[claude-bridge] op=${op} table=${table}`);

  try {
    if (op === 'select') {
      let q = supabase.from(table).select(payload.columns ?? '*');
      if (payload.filters) {
        for (const [k, v] of Object.entries(payload.filters)) q = q.eq(k, v as never);
      }
      const limit = Math.min(payload.limit ?? 100, 500);
      const { data, error, count } = await q.limit(limit);
      if (error) return json({ error: error.message }, 400);
      console.log(`[claude-bridge] ok select rows=${data?.length ?? 0} ms=${Date.now() - started}`);
      return json({ data, count });
    }

    if (op === 'insert') {
      if (!Array.isArray(payload.rows) || payload.rows.length === 0) {
        return json({ error: 'rows[] required' }, 400);
      }
      if (payload.rows.length > 1000) return json({ error: 'Max 1000 rows per call' }, 400);
      const { data, error } = await supabase.from(table).insert(payload.rows).select();
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
