import { ancoraReformaBairro, reformaBairroUrl } from "@/data/artigosBewild";

/** "Vai reformar um studio em <Bairro>?" → página de reforma do bairro no bewild.com.br (sem UTM). */
export default function BlocoReformaBairro({ bairro }: { bairro: string }) {
  return (
    <div className="min-w-0">
      <h3 className="e-h3">Vai reformar um studio em {bairro}?</h3>
      <a href={reformaBairroUrl(bairro)} className="e-link mt-1 inline-flex min-h-[44px] items-center text-[15px]">
        {ancoraReformaBairro(bairro)}
      </a>
    </div>
  );
}
