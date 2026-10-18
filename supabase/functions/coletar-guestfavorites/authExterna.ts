export async function chaveExternaValida(recebida: string | null, esperada: string | undefined): Promise<boolean> {
  if (!recebida || !esperada) return false;
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([recebida, esperada].map((s) => crypto.subtle.digest("SHA-256", encoder.encode(s))));
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diferenca = 0;
  for (let i = 0; i < x.length; i++) diferenca |= x[i] ^ y[i];
  return diferenca === 0;
}