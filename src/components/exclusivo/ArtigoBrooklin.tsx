import { Figura, TabelaNumerada, TD, TD_NUM, TH } from "@/components/estudo/Figura";
import { AvisoReceita, GradeIndicadores, Indicador } from "@/components/estudo/Numeros";
import { Tag } from "@/components/estudo/Natureza";
import { tipoPonto } from "@/components/estudo/graficos/LegendaPontos";
import { BarrasHorizontais, DispersaoOcupacaoDiaria, LegendaMarcas, type LinhaBarra } from "@/components/exclusivo/GraficosArtigo";
import { Bloco, CabecalhoArtigo, ChamadaFinal, CorpoArtigo, Destaque, FontesMetodo, H2, LinkExterno, LinkRadar, P, Passos } from "@/components/exclusivo/EstruturaArtigo";
import { ARTIGOS_BEWILD } from "@/data/artigosBewild";
import { artigoExclusivoPorSlug } from "@/data/artigosExclusivos";
import { URL_ITAIM_BIBI, receitaMensalReferencia } from "@/data/bairrosCurados";
import { TEXTO_DRE_PERCENTUAIS } from "@/data/dreGuia";
import { AREA_MEDIANA_M2, CONTRATOS_ANALISADOS, ORCAMENTO_MEDIANO, PRAZO_DIAS_UTEIS_MAX, PRAZO_DIAS_UTEIS_MIN } from "@/data/provasBewild";
import { linkSimuladorBairro } from "@/data/navegacao";
import {
  ORDINAL, bairroDaBase, bairrosObservados, cenario, distanciaMediaMediana, faixaOcupacao, listaPt,
  rankingDistanciaMediana, receitaCom, receitaSaoPaulo,
} from "@/lib/artigosExclusivos";
import { temAmostraPequena } from "@/lib/estudo";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { cn } from "@/lib/utils";

const nPt = (v: number) => formatDecimal(v, 0);
/** Bairros próximos ao Brooklin com dado próprio, usados como régua de comparação. */
const PROXIMOS = ["Moema", "Santo Amaro", "Campo Belo"] as const;

export default function ArtigoBrooklin() {
  const artigo = artigoExclusivoPorSlug("brooklin")!;
  const bro = bairroDaBase("Brooklin");
  const itaim = bairroDaBase("Itaim Bibi");
  const [q25, q50, q75] = bro.dailyQuartiles!;
  const antiga = bro.referenciaBewild!;
  const receita = receitaMensalReferencia(bro);
  const receitaAntiga = receitaCom(antiga.dailyAvg, antiga.avgOccupancy);
  const { min, max } = faixaOcupacao();
  const morumbi = bairroDaBase("Morumbi");
  const sp = receitaSaoPaulo();
  const campoBelo = bairroDaBase("Campo Belo");
  const posDistancia = rankingDistanciaMediana().findIndex((b) => b.name === itaim.name) + 1;
  const receitaCampoBelo = receitaMensalReferencia(campoBelo);
  const cenarios = [
    { rotulo: `Bairro próximo com dado próprio (${campoBelo.name})`, natureza: "Observado", diaria: campoBelo.dailyAvg, ocupacao: campoBelo.avgOccupancy },
    { rotulo: "Partida (mediana do Itaim Bibi)", natureza: "Aproximação", diaria: q50, ocupacao: bro.avgOccupancy, destaque: true },
    { rotulo: "Referência do Radar (média do Itaim Bibi)", natureza: "Aproximação", diaria: bro.dailyAvg, ocupacao: bro.avgOccupancy },
  ].map((c) => ({ ...c, r: cenario(c.diaria, c.ocupacao) }));

  const linhasBarra: LinhaBarra[] = [
    { nome: "Itaim · 25% mais caros", valor: receitaCom(q75, bro.avgOccupancy), tipo: "aproximacao", descricao: `Diária de ${formatBRL(q75)} (limite dos 25% mais caros do Itaim Bibi) × 30 × ${nPt(bro.avgOccupancy)}%` },
    { nome: "Itaim · média", valor: receita, tipo: "aproximacao", destaque: true, descricao: `Diária média do Itaim Bibi, ${formatBRL(bro.dailyAvg)} × 30 × ${nPt(bro.avgOccupancy)}%: número usado nas contas do Brooklin` },
    { nome: "Itaim · mediana", valor: receitaCom(q50, bro.avgOccupancy), tipo: "aproximacao", descricao: `Diária mediana do Itaim Bibi, ${formatBRL(q50)} × 30 × ${nPt(bro.avgOccupancy)}%` },
    ...PROXIMOS.map((nome) => {
      const b = bairroDaBase(nome);
      const r = receitaMensalReferencia(b);
      return { nome, valor: r, tipo: (temAmostraPequena(b) ? "amostra" : "observado") as LinhaBarra["tipo"], descricao: `${nome}: ${nPt(b.avgOccupancy)}% × ${formatBRL(b.dailyAvg)} × 30 = ${formatBRL(r)} por mês, dado próprio` } satisfies LinhaBarra;
    }),
    { nome: "Itaim · 25% mais baratos", valor: receitaCom(q25, bro.avgOccupancy), tipo: "aproximacao", descricao: `Diária de ${formatBRL(q25)} (limite dos 25% mais baratos do Itaim Bibi) × 30 × ${nPt(bro.avgOccupancy)}%` },
  ];
  const barras = [...linhasBarra].sort((a, b) => b.valor - a.valor);

  const pontos = [
    ...bairrosObservados().map((b) => ({
      nome: b.name,
      ocupacao: b.avgOccupancy,
      diaria: b.dailyAvg,
      tipo: tipoPonto(b),
      destaque: b.name === itaim.name,
      rotulo: b.name === itaim.name
        ? { texto: itaim.name, lado: "esquerda" as const, apoio: "aproximação usada" }
        : b.name === morumbi.name ? { texto: morumbi.name, lado: "direita" as const } : undefined,
    })),
    { nome: "Estimativa antiga", ocupacao: antiga.avgOccupancy, diaria: antiga.dailyAvg, tipo: "estimativa" as const, rotulo: { texto: "Estimativa antiga", lado: "acima" as const, apoio: "fora das contas" } },
  ];

  return (
    <>
      <CabecalhoArtigo
        artigo={artigo}
        rotulo="Análise de bairro · Brooklin"
        lead="O Brooklin não tem dado público próprio de ocupação e diária. O Radar usa o Itaim Bibi como aproximação. Veja até onde essa referência vai e como montar cenários sem cair numa conta otimista."
      >
        <GradeIndicadores className="lg:grid-cols-5">
          <Indicador pequeno rotulo={<span className="flex flex-wrap items-center gap-1.5">Ocupação <Tag tipo="aproximacao" /></span>} valor={`${nPt(bro.avgOccupancy)}%`} nota="do Itaim Bibi" />
          <Indicador pequeno rotulo={<span className="flex flex-wrap items-center gap-1.5">Diária média <Tag tipo="aproximacao" /></span>} valor={formatBRL(bro.dailyAvg)} nota="do Itaim Bibi" />
          <Indicador pequeno rotulo={<span className="flex flex-wrap items-center gap-1.5">Mediana <Tag tipo="aproximacao" /></span>} valor={formatBRL(q50)} nota="do Itaim Bibi" />
          <Indicador pequeno rotulo="Anúncios no bairro" valor="sem dado" nota={`${nPt(itaim.activeListings ?? 0)} no distrito`} />
          <Indicador pequeno rotulo={<span className="flex flex-wrap items-center gap-1.5">Receita <Tag tipo="aproximacao" /></span>} valor={formatBRL(receita)} nota="por mês, antes dos custos" />
        </GradeIndicadores>
      </CabecalhoArtigo>

      <CorpoArtigo>
        <P>
          Quem procura números de short stay para o Brooklin encontra um problema antes da resposta: a GuestFavorites, fonte pública que o Radar usa para {bairrosObservados().length} bairros de São Paulo, não publica uma página só do Brooklin. Por isso o Radar mostra o bairro com os números do <strong>distrito Itaim Bibi</strong> ({nPt(bro.avgOccupancy)}% de ocupação e diária média de {formatBRL(bro.dailyAvg)}, {bro.period}), que inclui a Vila Olímpia e parte do Brooklin, sempre com a etiqueta <Tag tipo="aproximacao" />.
        </P>
        <P>
          A aproximação serve para comparar o Brooklin com o resto da cidade. Ela não diz quanto fatura um studio em um prédio específico do bairro. A diferença importa: dentro da faixa que ela cobre, a receita mensal de referência vai de {formatBRL(receitaCom(q25, bro.avgOccupancy))} a {formatBRL(receitaCom(q75, bro.avgOccupancy))}. Este artigo mostra como trabalhar com essa incerteza.
        </P>

        <H2>De onde vem o número do Brooklin</H2>
        <Bloco>
          <Figura numero={1} titulo="Como o Radar chega ao número que usa nas contas" unidade="O mesmo caminho vale para a Vila Olímpia." fonte={<><LinkExterno href={URL_ITAIM_BIBI}>GuestFavorites — Itaim Bibi</LinkExterno>, {bro.period}, coleta de 18/10/2026.</>}>
            <ol className="m-0 grid max-w-[720px] list-none gap-2 p-0 text-[15px] leading-[22px]">
              <li className="border border-foreground/15 bg-card px-4 py-3"><span className="e-rotulo block">Pergunta</span>Existe página pública com ocupação e diária só do Brooklin?</li>
              <li aria-hidden="true" className="text-center text-tinta-70">↓</li>
              <li className="border border-foreground/15 bg-card px-4 py-3"><span className="e-rotulo block">Resposta</span>Não. A GuestFavorites publica o distrito Itaim Bibi, que inclui a Vila Olímpia e parte do Brooklin, mas não o bairro sozinho.</li>
              <li aria-hidden="true" className="text-center text-tinta-70">↓</li>
              <li className="grid gap-2 sm:grid-cols-[3fr_2fr]">
                <div className="border-[1.5px] border-dashed border-ciano-700 bg-ciano-100 px-4 py-3">
                  <span className="e-rotulo block text-ciano-700">Usado nas contas · aproximação</span>
                  Números do Itaim Bibi: {nPt(bro.avgOccupancy)}% de ocupação, diária média {formatBRL(bro.dailyAvg)}, quartis {formatBRL(q25)} / {formatBRL(q50)} / {formatBRL(q75)}. O filtro “Só dados observados” do Radar deixa o Brooklin de fora.
                </div>
                <div className="border-[1.5px] border-dashed border-neutro-500 px-4 py-3 text-tinta-78">
                  <span className="e-rotulo block">Só referência · fora das contas</span>
                  Estimativa Bewild (dados anteriores, sem fonte pública): {nPt(antiga.avgOccupancy)}% de ocupação e diária de {formatBRL(antiga.dailyAvg)}.
                </div>
              </li>
            </ol>
          </Figura>
        </Bloco>
        <P>Um ponto prático: os {nPt(itaim.activeListings ?? 0)} anúncios publicados pela fonte são do distrito inteiro. Não existe contagem confiável de anúncios só do Brooklin, e por isso o Radar não mostra esse número para o bairro.</P>

        <H2>Por que a estimativa antiga ficou fora das contas</H2>
        <P>Antes da base pública, o Radar exibia para o Brooklin uma estimativa da Bewild de {nPt(antiga.avgOccupancy)}% de ocupação. Comparada com os dados observados, ela fica fora do que foi medido na cidade.</P>

        <Bloco>
          <Figura
            numero={2}
            titulo={<>Nenhum bairro medido passa de {nPt(max.avgOccupancy)}% de ocupação</>}
            unidade="Cada ponto é um bairro com dado próprio. Faixa azul: intervalo de ocupação observado na base."
            legenda={
              <LegendaMarcas
                itens={[
                  { simbolo: "observado", texto: "Bairro com dado próprio" },
                  { simbolo: "amostra", texto: "Amostra pequena, menos de 200 anúncios: leia com cautela" },
                  { simbolo: "destaque", texto: "Itaim Bibi, aproximação usada para o Brooklin" },
                  { simbolo: "estimativa", texto: "Estimativa antiga do Brooklin (sem fonte pública)" },
                ]}
              />
            }
            fonte={<>GuestFavorites, {bro.period}, coleta de 18/10/2026 (Moema: 13/10/2026). Estimativa antiga: Bewild, sem fonte pública.</>}
          >
            <DispersaoOcupacaoDiaria
              pontos={pontos}
              faixa={[min.avgOccupancy, max.avgOccupancy]}
              dominioX={[50, 80]}
              dominioY={[150, 500]}
              descricao={`Ocupação e diária média de ${bairrosObservados().length} bairros. Todos ficam entre ${nPt(min.avgOccupancy)}% e ${nPt(max.avgOccupancy)}% de ocupação. O Itaim Bibi, usado como aproximação do Brooklin, está em ${nPt(itaim.avgOccupancy)}% e ${formatBRL(itaim.dailyAvg)}. A estimativa antiga do Brooklin, ${nPt(antiga.avgOccupancy)}% e ${formatBRL(antiga.dailyAvg)}, fica fora da faixa observada.`}
            />
            <details className="mt-4">
              <summary className="e-link inline-flex min-h-[44px] cursor-pointer items-center text-[15px]">Ver os valores em tabela</summary>
              <TabelaNumerada numero={1} titulo="Ocupação e diária média dos bairros com dado próprio" unidade={`GuestFavorites, ${bro.period}.`} className="mt-4">
                <thead>
                  <tr>
                    <th scope="col" className={TH}>Bairro</th>
                    <th scope="col" className={cn(TH, "text-right")}>Ocupação</th>
                    <th scope="col" className={cn(TH, "text-right")}>Diária média</th>
                  </tr>
                </thead>
                <tbody>
                  {[...bairrosObservados()].sort((a, b) => b.avgOccupancy - a.avgOccupancy || b.dailyAvg - a.dailyAvg).map((b) => (
                    <tr key={b.name}>
                      <th scope="row" className={cn(TD, b.name === itaim.name ? "font-semibold text-magenta-700" : "font-normal")}>
                        {b.name}{temAmostraPequena(b) && <span className="e-amostra block text-[13px] font-normal">amostra pequena ({nPt(b.activeListings ?? 0)} anúncios)</span>}
                      </th>
                      <td className={TD_NUM}>{nPt(b.avgOccupancy)}%</td>
                      <td className={TD_NUM}>{formatBRL(b.dailyAvg)}</td>
                    </tr>
                  ))}
                </tbody>
              </TabelaNumerada>
            </details>
          </Figura>
        </Bloco>

        <P>
          Nenhum dos {bairrosObservados().length} bairros com dado público passa de <strong>{nPt(max.avgOccupancy)}% de ocupação</strong> ({max.name}). A estimativa antiga ficaria {nPt(antiga.avgOccupancy - max.avgOccupancy)} pontos acima do maior valor observado. Na régua da receita de referência, ela daria {formatBRL(receitaAntiga)} por mês, perto do {morumbi.name} ({formatBRL(receitaMensalReferencia(morumbi))}), um bairro com diária média de {formatBRL(morumbi.dailyAvg)}. Por isso ela aparece só como referência, fora de qualquer conta.
        </P>
        <Destaque>Uma ocupação que nenhum bairro medido alcança não deve sustentar uma decisão de compra.</Destaque>

        <H2>A faixa que a aproximação cobre</H2>
        <P>Os quartis do Itaim Bibi mostram como a diária varia dentro do distrito. Aplicando a ocupação de {nPt(bro.avgOccupancy)}% a cada quartil, e colocando ao lado bairros próximos com dado próprio, aparece o intervalo em que um studio no Brooklin pode cair.</P>

        <Bloco>
          <Figura
            numero={3}
            titulo={<>Pela aproximação, a receita do Brooklin vai de {formatBRL(receitaCom(q25, bro.avgOccupancy))} a {formatBRL(receitaCom(q75, bro.avgOccupancy))} por mês</>}
            unidade={`Diária × 30 × ocupação, em R$ por mês. Barras tracejadas: aproximação pelo Itaim Bibi, com ${nPt(bro.avgOccupancy)}% de ocupação. Linha tracejada: São Paulo (${formatBRL(sp)}).`}
            legenda={
              <LegendaMarcas
                itens={[
                  { simbolo: "aproximacao-destaque", texto: "Número usado nas contas (média do Itaim Bibi)" },
                  { simbolo: "aproximacao", texto: "Outros quartis do Itaim Bibi" },
                  { simbolo: "observado", texto: "Bairro próximo com dado próprio" },
                  { simbolo: "referencia", texto: "São Paulo" },
                ]}
              />
            }
            fonte={<>GuestFavorites, {bro.period} (Itaim Bibi, Campo Belo e Santo Amaro: coleta de 18/10/2026; Moema: 13/10/2026). <Tag tipo="hipotese" /> mesma ocupação em todos os quartis do Itaim Bibi.</>}
          >
            <BarrasHorizontais linhas={barras} maximo={7500} marcas={[0, 3000, 6000]} referencia={{ valor: sp, rotulo: "São Paulo" }} />
          </Figura>
        </Bloco>

        <P>Entre a média do Itaim Bibi ({formatBRL(receita)}) e {campoBelo.name} ({formatBRL(receitaCampoBelo)}) há {formatBRL(receita - receitaCampoBelo)} por mês de receita. A aproximação não diz em que ponto dessa faixa está um prédio específico do Brooklin. O que ela permite é testar a decisão em cenários diferentes e ver se o investimento se sustenta no cenário mais modesto.</P>

        <H2>Três cenários para começar a conta</H2>
        <P>Os cenários abaixo aplicam o DRE padrão do guia ({TEXTO_DRE_PERCENTUAIS}), mais condomínio e contas de exemplo. Todos os custos são <Tag tipo="hipotese" /> editáveis no simulador.</P>

        <Bloco>
          <TabelaNumerada
            numero={2}
            titulo="Resultado líquido mensal de referência para um studio no Brooklin"
            unidade="R$ por mês."
            nota={<>GuestFavorites, {bro.period}, coleta de 18/10/2026. Custos: DRE padrão do guia, com condomínio e contas de exemplo (hipóteses).</>}
          >
            <thead>
              <tr>
                <th scope="col" className={TH}>Cenário</th>
                <th scope="col" className={cn(TH, "text-right")}>Diária · ocupação</th>
                <th scope="col" className={cn(TH, "hidden text-right sm:table-cell")}>Receita bruta</th>
                <th scope="col" className={cn(TH, "text-right")}>Líquido/mês</th>
              </tr>
            </thead>
            <tbody>
              {cenarios.map((c) => (
                <tr key={c.rotulo}>
                  <th scope="row" className={cn(TD, c.destaque ? "font-semibold text-magenta-700" : "font-normal")}>
                    {c.rotulo}
                    <span className="mt-1 block"><Tag tipo={c.natureza === "Observado" ? "observado" : "aproximacao"} /></span>
                  </th>
                  <td className={TD_NUM}>{formatBRL(c.diaria)} · {nPt(c.ocupacao)}%</td>
                  <td className={cn(TD_NUM, "hidden sm:table-cell")}>{formatBRL(c.r.receitaBruta)}</td>
                  <td className={cn(TD_NUM, c.destaque && "font-semibold")}>{formatBRL(c.r.liquido)}</td>
                </tr>
              ))}
            </tbody>
          </TabelaNumerada>
        </Bloco>

        <P>
          A sugestão é começar pela linha do meio. A mediana do Itaim Bibi descreve o anúncio comum do distrito, enquanto a média é puxada pelos anúncios mais caros ({formatBRL(distanciaMediaMediana(itaim))} de diferença, a {ORDINAL[posDistancia]} maior distância entre média e mediana da base). Se o investimento só fecha na última linha, com a média, o risco de frustração é alto.
        </P>

        <H2>O que confirmar antes de comprar no Brooklin</H2>
        <P>Como o dado público não chega ao nível do bairro, a verificação local pesa mais aqui do que nos bairros com dado próprio.</P>
        <Passos
          itens={[
            { titulo: "Olhe os anúncios do próprio prédio e da quadra.", texto: "Busque o endereço no Airbnb, anote diárias e veja a disponibilidade dos calendários em datas diferentes. É o sinal local que a aproximação não oferece." },
            { titulo: "Confirme as regras do condomínio.", texto: <>A convenção pode restringir a locação por temporada. Veja <LinkExterno href={ARTIGOS_BEWILD.lei.url}>o que a lei permite para studios no Airbnb em São Paulo</LinkExterno>.</> },
            { titulo: "Simule com o preço real.", texto: <>No <LinkRadar to={linkSimuladorBairro("brooklin")}>simulador do Radar</LinkRadar>, ajuste a diária para {formatBRL(q50)} e compare com o padrão de {formatBRL(bro.dailyAvg)}. Veja a rentabilidade anual e o prazo estimado de retorno nos dois casos.</> },
            { titulo: "Compare com os bairros medidos.", texto: <>No <LinkRadar to="/comparar">comparador</LinkRadar>, coloque o Brooklin ao lado de {listaPt(["Campo Belo", "Moema"])}, que têm dado próprio.</> },
            { titulo: "Some a reforma ao investimento.", texto: <>No estudo da Bewild com {CONTRATOS_ANALISADOS} contratos de reforma completa em São Paulo, o orçamento mediano foi {formatBRL(ORCAMENTO_MEDIANO)} para {formatDecimal(AREA_MEDIANA_M2, 1)} m², com prazo em contrato de {PRAZO_DIAS_UTEIS_MIN} a {PRAZO_DIAS_UTEIS_MAX} dias úteis. <LinkExterno href={ARTIGOS_BEWILD.custoReforma.url}>Veja o estudo de custos de reforma</LinkExterno>.</> },
          ]}
        />
        <P>Quando houver uma fonte pública com dados próprios do Brooklin, o Radar troca a aproximação e registra a mudança na <LinkRadar to="/metodologia">metodologia</LinkRadar>.</P>

        <ChamadaFinal
          titulo="Teste o Brooklin com os seus números"
          texto="Rode os cenários com o preço do imóvel que você está avaliando, partindo da mediana do Itaim Bibi."
          simularHref={linkSimuladorBairro("brooklin")}
          simularRotulo="Simular Brooklin"
        />

        <AvisoReceita className="mt-6" />

        <FontesMetodo
          itens={[
            <>Brooklin: aproximação pelo <LinkExterno href={URL_ITAIM_BIBI}>Itaim Bibi (GuestFavorites)</LinkExterno>, {bro.period}, aprovado na base do Radar em {artigo.baseEm}. O distrito inclui a Vila Olímpia e parte do Brooklin; não há contagem de anúncios por bairro.</>,
            <>Estimativa Bewild (dados anteriores, sem fonte pública): {nPt(antiga.avgOccupancy)}% / {formatBRL(antiga.dailyAvg)}, mostrada só como referência e fora das contas.</>,
            <>Demais bairros: páginas da GuestFavorites de cada bairro, {bro.period}. Amostra pequena (menos de 200 anúncios): {listaPt(bairrosObservados().filter(temAmostraPequena).map((b) => b.name))}.</>,
            <>Receita mensal de referência = diária × 30 × ocupação. Custos: DRE padrão do guia e despesas de exemplo, hipóteses editáveis. Ver a <LinkRadar to="/metodologia">metodologia do Radar</LinkRadar>.</>,
          ]}
        />
      </CorpoArtigo>
    </>
  );
}
