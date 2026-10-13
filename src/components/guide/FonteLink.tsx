import type { FonteGuia } from "@/data/fontesGuia";

export default function FonteLink({ fonte }: { fonte: FonteGuia }) {
  return (
    <a href={fonte.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] max-w-full items-center text-xs text-primary underline underline-offset-4 break-words">
      {fonte.title}
    </a>
  );
}