export async function authenticatedChat(
  header: string | null,
  verify: (token: string) => Promise<{ data: { user: { id: string; is_anonymous?: boolean } | null }; error: unknown }>,
): Promise<boolean> {
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  if (!match) return false;
  try {
    const { data, error } = await verify(match[1]);
    return !error && Boolean(data.user?.id) && data.user?.is_anonymous !== true;
  } catch { return false; }
}
export function validateChatBody(body: unknown): { messages: { role: 'user' | 'assistant'; content: string }[]; projectContext?: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Mensagem inválida.');
  const { messages, projectContext } = body as Record<string, unknown>;
  if (!Array.isArray(messages) || !messages.length || messages.length > 40) throw new Error('Envie entre 1 e 40 mensagens.');
  let total = 0;
  const clean = messages.map((message) => {
    if (!message || typeof message !== 'object') throw new Error('Mensagem inválida.');
    const { role, content } = message;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim() || content.length > 8000) throw new Error('Mensagem inválida.');
    total += content.length;
    return { role: role as 'user' | 'assistant', content };
  });
  if (total > 60000 || (projectContext !== undefined && (typeof projectContext !== 'string' || projectContext.length > 4000))) throw new Error('Conversa muito longa.');
  return { messages: clean, ...(typeof projectContext === 'string' ? { projectContext } : {}) };
}