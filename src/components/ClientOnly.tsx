import { useEffect, useState, type ReactNode } from "react";

/** Renderiza os filhos só no navegador, após montar (fica fora do HTML pré-renderizado). */
export default function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
}
