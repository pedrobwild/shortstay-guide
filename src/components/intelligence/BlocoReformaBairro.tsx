import { ancoraReformaBairro, reformaBairroUrl } from "@/data/artigosBewild";

/** "Vai reformar um studio em <Bairro>?" → página de reforma do bairro no bewild.com.br (sem UTM). */
export default function BlocoReformaBairro({ bairro }: { bairro: string }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 md:p-6">
      <h2 className="font-display text-xl font-bold text-foreground">Vai reformar um studio em {bairro}?</h2>
      <a href={reformaBairroUrl(bairro)} className="mt-1 inline-flex min-h-[44px] items-center text-sm font-medium text-primary underline underline-offset-4">
        {ancoraReformaBairro(bairro)}
      </a>
    </section>
  );
}
