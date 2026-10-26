import { Figura, TabelaNumerada, TD, TD_NUM, TH } from "@/components/estudo/Figura";
import { AvisoReceita, GradeIndicadores, Indicador } from "@/components/estudo/Numeros";
import { Tag } from "@/components/estudo/Natureza";
import { BarrasHorizontais, LegendaMarcas, LegendaQuartis, QuartisComparados } from "@/components/exclusivo/GraficosArtigo";
import { Bloco, CabecalhoArtigo, ChamadaFinal, CorpoArtigo, Destaque, FontesMetodo, H2, LinkExterno, LinkRadar, P, Passos } from "@/components/exclusivo/EstruturaArtigo";
import { ARTIGOS_BEWILD } from "@/data/artigosBewild";
import { artigoExclusivoPorSlug } from "@/data/artigosExclusivos";
import { SAO_PAULO_REFERENCIA, receitaMensalReferencia } from "@/data/bairrosCurados";
import { TEXTO_DRE_PERCENTUAIS } from "@/data/dreGuia";
import { AREA_MEDIANA_M2, CONTRATOS_ANALISADOS, ORCAMENTO_MEDIANO, ORCAMENTO_MINIMO_BASE, PRAZO_DIAS_UTEIS_MAX, PRAZO_DIAS_UTEIS_MIN } from "@/data/provasBewild";
import { linkSimuladorBairro } from "@/data/navegacao";
import {
  ORDINAL, ORDINAL_M, bairroDaBase, bairrosObservados, cenario, distanciaMediaMediana, faixaOcupacao, listaPt,
  participacaoAnuncios, posicaoReceita, rankingDistanciaMediana, rankingReceita, receitaSaoPaulo,
} from "@/lib/artigosExclusivos";
import { temAmostraPequena } from "@/lib/estudo";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { cn } from "@/lib/utils";

const nPt = (v: number) => formatDecimal(v, 0);

export default function ArtigoPinheiros() {
  const artigo = artigoExclusivoPorSlug("pinheiros")!;
  const pin = bairroDaBase("Pinheiros");
  const [p25, p50, p75] = pin.dailyQuartiles!;
  const ranking = rankingReceita();
  const posicao = posicaoReceita(pin.name);
  const acima = ranking.slice(0, posicao - 1).map((l) => l.bairro.name);
  const topo = ranking.slice(0, 4);
  const receita = receitaMensalReferencia(pin);
  const sp = receitaSaoPaulo();
  const acimaSp = Math.round((receita / sp - 1) * 100);
  const { max: maiorOcupacao } = faixaOcupacao();
  const maisCaros = bairrosObservados().filter((b) => b.dailyAvg > pin.dailyAvg).sort((a, b) => b.dailyAvg - a.dailyAvg);
  const jp = bairroDaBase("Jardim Paulista");
  const distancias = rankingDistanciaMediana().slice(0, 5).map((b) => b.name);
  const outrosDistancia = distancias.filter((n) => n !== pin.name);
  const anunciosOrdem = [...bairrosObservados()].sort((a, b) => (b.activeListings ?? 0) - (a.activeListings ?? 0)).findIndex((b) => b.name === pin.name) + 1;
  const exemplo = cenario(pin.dailyAvg, pin.avgOccupancy);
  const faixas = [
    { rotulo: "25% mais baratos (até)", diaria: p25 },
    { rotulo: "Mediana (studio típico)", diaria: p50, destaque: true },
    { rotulo: "Média (exemplo do Radar)", diaria: pin.dailyAvg },
    { rotulo: "25% mais caros (a partir de)", diaria: p75 },
  ].map((f) => ({ ...f, r: cenario(f.diaria, pin.avgOccupancy) }));
  const tipico = faixas[1].r;
  const fonte = { title: "GuestFavorites — Pinheiros", url: pin.sourceUrl! };

  return (
    <>
      <CabecalhoArtigo
        artigo={artigo}
        rotulo="Análise de bairro · Pinheiros"
        lead={<>Pinheiros tem a {ORDINAL[posicao]} maior receita de referência entre os bairros do Radar com dado próprio. A diária média, porém, descreve um studio entre os 25% mais caros do bairro. Veja como montar a conta a partir do studio típico.</>}
      >
        <GradeIndicadores className="lg:grid-cols-5">
          <Indicador pequeno rotulo="Ocupação" valor={`${nPt(pin.avgOccupancy)}%`} nota={`São Paulo: ${nPt(SAO_PAULO_REFERENCIA.avgOccupancy)}%`} />
          <Indicador pequeno rotulo="Diária média" valor={formatBRL(pin.dailyAvg)} nota={`São Paulo: ${formatBRL(SAO_PAULO_REFERENCIA.dailyAvg)}`} />
          <Indicador pequeno rotulo="Diária mediana" valor={formatBRL(p50)} nota="metade cobra até isso" />
          <Indicador pequeno rotulo="Anúncios" valor={nPt(pin.activeListings ?? 0)} nota={`São Paulo: ${nPt(SAO_PAULO_REFERENCIA.activeListings)}`} />
          <Indicador pequeno rotulo="Receita de referência" valor={formatBRL(receita)} nota="por mês, antes dos custos" />
        </GradeIndicadores>
      </CabecalhoArtigo>

      <CorpoArtigo>
        <P>
          Um studio em Pinheiros alugado por temporada fatura, na referência do Radar, <strong>{formatBRL(receita)} por mês</strong> antes dos custos: diária média de {formatBRL(pin.dailyAvg)}, ocupada {nPt(pin.avgOccupancy)}% do tempo. É a {ORDINAL[posicao]} maior receita entre os {bairrosObservados().length} bairros de São Paulo com dado público próprio na base, atrás de {listaPt(acima)}, e {acimaSp}% acima da referência da cidade ({formatBRL(sp)}).
        </P>
        <P>
          Esse número é um bom ponto de partida para comparar bairros. Para decidir uma compra, ele precisa de um ajuste: a diária média de Pinheiros é puxada pelos anúncios mais caros. Metade dos anúncios do bairro cobra até <strong>{formatBRL(p50)}</strong>. A conta feita pela média supõe um studio que já está no grupo de cima.
        </P>
        <P className="flex flex-wrap items-center gap-2">
          <Tag tipo="observado" /> <span>Todos os números de mercado deste texto vêm da página pública da GuestFavorites para Pinheiros ({pin.period}), aprovada na base do Radar em {artigo.baseEm}. Custos e cenários são hipóteses e estão marcados como tal.</span>
        </P>

        <H2>Pinheiros entre os {bairrosObservados().length} bairros da base</H2>
        <P>A receita mensal de referência multiplica a diária média por 30 dias e pela ocupação. Ela junta os dois indicadores que o investidor costuma olhar separados e permite comparar bairros na mesma régua.</P>

        <Bloco>
          <Figura
            numero={1}
            titulo={<>Pinheiros tem a {ORDINAL[posicao]} maior receita de referência da base</>}
            unidade={`Diária média × 30 × ocupação, em R$ por mês. Linha tracejada: São Paulo (${formatBRL(sp)}).`}
            legenda={
              <LegendaMarcas
                itens={[
                  { simbolo: "destaque", texto: "Pinheiros" },
                  { simbolo: "observado", texto: "Outros bairros com dado próprio" },
                  { simbolo: "amostra", texto: `Amostra pequena, menos de 200 anúncios (${listaPt(ranking.filter((l) => temAmostraPequena(l.bairro)).map((l) => `${l.bairro.name}, ${nPt(l.bairro.activeListings ?? 0)}`))}): leia com cautela` },
                  { simbolo: "referencia", texto: "São Paulo" },
                ]}
              />
            }
            fonte={<>GuestFavorites, {pin.period} (coleta de 18/10/2026; Moema, 13/10/2026). Brooklin e Vila Olímpia ficam fora: não têm dado próprio.</>}
          >
            <BarrasHorizontais
              maximo={8500}
              marcas={[0, 4000, 8000]}
              referencia={{ valor: sp, rotulo: "São Paulo" }}
              linhas={ranking.map(({ bairro: b, receita: r }) => ({
                nome: b.name,
                valor: r,
                tipo: temAmostraPequena(b) ? "amostra" : "observado",
                destaque: b.name === pin.name,
                descricao: `${b.name}: ${nPt(b.avgOccupancy)}% × ${formatBRL(b.dailyAvg)} × 30 = ${formatBRL(r)} por mês${temAmostraPequena(b) ? ", amostra pequena" : ""}`,
              }))}
            />
          </Figura>
        </Bloco>

        <P>O que separa Pinheiros dos primeiros colocados é o caminho até a receita. {listaPt(maisCaros.map((b) => b.name))} chegam lá pela diária; Pinheiros chega com uma diária menor e a ocupação mais alta do grupo.</P>

        <Bloco>
          <TabelaNumerada numero={1} titulo="Os quatro bairros de maior receita de referência" unidade={`GuestFavorites, ${pin.period}. Receita = diária média × 30 × ocupação.`}>
            <thead>
              <tr>
                <th scope="col" className={TH}>Bairro</th>
                <th scope="col" className={cn(TH, "text-right")}>Ocupação</th>
                <th scope="col" className={cn(TH, "text-right")}>Diária média</th>
                <th scope="col" className={cn(TH, "hidden text-right sm:table-cell")}>Mediana</th>
                <th scope="col" className={cn(TH, "hidden text-right sm:table-cell")}>Anúncios</th>
                <th scope="col" className={cn(TH, "text-right")}>Receita/mês</th>
              </tr>
            </thead>
            <tbody>
              {topo.map(({ bairro: b, receita: r }) => {
                const eu = b.name === pin.name;
                return (
                  <tr key={b.name} className={cn(eu && "font-semibold")}>
                    <th scope="row" className={cn(TD, eu ? "font-semibold text-magenta-700" : "font-normal")}>{b.name}</th>
                    <td className={TD_NUM}>{nPt(b.avgOccupancy)}%</td>
                    <td className={TD_NUM}>{formatBRL(b.dailyAvg)}</td>
                    <td className={cn(TD_NUM, "hidden sm:table-cell")}>{formatBRL(b.dailyQuartiles![1])}</td>
                    <td className={cn(TD_NUM, "hidden sm:table-cell")}>{nPt(b.activeListings ?? 0)}</td>
                    <td className={TD_NUM}>{formatBRL(r)}</td>
                  </tr>
                );
              })}
            </tbody>
          </TabelaNumerada>
        </Bloco>

        <P>
          Ocupação alta pesa porque cada ponto percentual vale para o ano inteiro. Com {nPt(pin.avgOccupancy)}%, Pinheiros fica a {nPt(maiorOcupacao.avgOccupancy - pin.avgOccupancy)} pontos do maior valor observado na base ({maiorOcupacao.name}, {nPt(maiorOcupacao.avgOccupancy)}%) e acima de todos os bairros com diária mais alta. {jp.name} cobra {formatBRL(jp.dailyAvg - pin.dailyAvg)} a mais por noite e ocupa {nPt(pin.avgOccupancy - jp.avgOccupancy)} ponto a menos; a diferença de receita entre os dois fica em {formatBRL(receitaMensalReferencia(jp) - receita)} por mês.
        </P>

        <H2>A média engana: onde está o studio típico</H2>
        <P>A GuestFavorites publica, além da média, os quartis da diária: o valor até onde vão os 25% mais baratos, a mediana e o valor a partir do qual estão os 25% mais caros. Em Pinheiros, a média ({formatBRL(pin.dailyAvg)}) fica a {formatBRL(p75 - pin.dailyAvg)} do limite dos 25% mais caros ({formatBRL(p75)}).</P>

        <Bloco>
          <Figura
            numero={2}
            titulo="Em Pinheiros, a diária média encosta no grupo dos 25% mais caros"
            unidade="Diária por noite (R$). Quartis de preço, não de metragem."
            legenda={<LegendaQuartis />}
            fonte={<>GuestFavorites, {pin.period}, coleta de 18/10/2026.</>}
          >
            <QuartisComparados
              dominio={[100, 450]}
              marcas={[100, 250, 400]}
              linhas={["Pinheiros", "Jardim Paulista", "Itaim Bibi"].map((nome) => {
                const b = bairroDaBase(nome);
                return { nome, quartis: b.dailyQuartiles!, media: b.dailyAvg, destaque: nome === pin.name };
              })}
            />
          </Figura>
        </Bloco>

        <P>
          Na prática, a média descreve um studio no limite do grupo mais caro do bairro. A distância entre média e mediana em Pinheiros ({formatBRL(distanciaMediaMediana(pin))}) é uma das cinco maiores da base, junto de {listaPt(outrosDistancia)}. Isso indica uma cauda de anúncios bem acima do restante, que eleva a média sem representar o anúncio comum.
        </P>
        <Destaque>Para planejar, trate a mediana como cenário de partida e a média como cenário para um studio que já disputa o topo do bairro.</Destaque>

        <H2>Quanto sobra por mês em cada faixa de diária</H2>
        <P>
          O exemplo de Pinheiros do Radar parte da média e aplica o DRE padrão do guia ({TEXTO_DRE_PERCENTUAIS}), mais {formatBRL(exemplo.deducoes.find((d) => d.chave === "condominio")?.valor ?? 0)} de condomínio e {formatBRL(exemplo.deducoes.find((d) => d.chave === "contas")?.valor ?? 0)} de contas. Resultado: <strong>{formatBRL(exemplo.liquido)} líquidos por mês</strong>. Todos os custos são <Tag tipo="hipotese" /> editáveis no simulador.
        </P>
        <P>Quando a mesma conta é feita para cada faixa de diária, mantendo a ocupação do bairro, a diferença aparece no líquido com mais força do que na diária. Os custos fixos não diminuem quando a diária cai.</P>

        <Bloco>
          <TabelaNumerada
            numero={2}
            titulo="Resultado líquido mensal por faixa de diária em Pinheiros"
            unidade={`R$ por mês, com a ocupação do bairro (${nPt(pin.avgOccupancy)}%) em todas as faixas.`}
            nota={<span className="flex flex-wrap items-center gap-2"><Tag tipo="hipotese" /> A fonte não publica ocupação por faixa de preço; custos pelo DRE padrão do guia, com condomínio e contas de exemplo.</span>}
          >
            <thead>
              <tr>
                <th scope="col" className={TH}>Faixa</th>
                <th scope="col" className={cn(TH, "text-right")}>Diária</th>
                <th scope="col" className={cn(TH, "hidden text-right sm:table-cell")}>Receita bruta</th>
                <th scope="col" className={cn(TH, "hidden text-right sm:table-cell")}>Custos</th>
                <th scope="col" className={cn(TH, "text-right")}>Líquido/mês</th>
              </tr>
            </thead>
            <tbody>
              {faixas.map((f) => (
                <tr key={f.rotulo}>
                  <th scope="row" className={cn(TD, f.destaque ? "font-semibold text-magenta-700" : "font-normal")}>{f.rotulo}<span className="e-legenda block font-normal sm:hidden">bruta {formatBRL(f.r.receitaBruta)}</span></th>
                  <td className={TD_NUM}>{formatBRL(f.diaria)}</td>
                  <td className={cn(TD_NUM, "hidden sm:table-cell")}>{formatBRL(f.r.receitaBruta)}</td>
                  <td className={cn(TD_NUM, "hidden sm:table-cell")}>−{formatBRL(f.r.totalDeducoes)}</td>
                  <td className={cn(TD_NUM, f.destaque && "font-semibold")}>{formatBRL(f.r.liquido)}</td>
                </tr>
              ))}
            </tbody>
          </TabelaNumerada>
        </Bloco>

        <P>
          Entre o studio típico ({formatBRL(tipico.liquido)}) e o exemplo pela média ({formatBRL(exemplo.liquido)}) há {formatBRL(exemplo.liquido - tipico.liquido)} por mês, ou {formatBRL((exemplo.liquido - tipico.liquido) * 12)} por ano. É esse intervalo que a escolha do imóvel, o projeto e o anúncio disputam. Nenhum deles garante a faixa de cima, mas são as variáveis que o investidor controla. O que pesa na escolha do hóspede está em <LinkExterno href={ARTIGOS_BEWILD.reservas.url}>{ARTIGOS_BEWILD.reservas.titulo.toLowerCase()}</LinkExterno>.
        </P>

        <H2>Concorrência: {nPt(pin.activeListings ?? 0)} anúncios no mesmo bairro</H2>
        <P>
          Pinheiros tem o {ORDINAL_M[anunciosOrdem]} maior número de anúncios da base, cerca de {formatDecimal(participacaoAnuncios(pin), 0)}% dos {nPt(SAO_PAULO_REFERENCIA.activeListings)} anúncios de São Paulo. Oferta grande é sinal de demanda consolidada, e também de comparação fácil: na busca do hóspede, um studio de Pinheiros aparece ao lado de muitos outros do mesmo bairro, com fotos e preços lado a lado. A Fig. 2 mostra que essa disputa acontece em faixas de preço bem diferentes.
        </P>

        <H2>Como usar esses números na sua decisão</H2>
        <Passos
          itens={[
            { titulo: "Monte dois cenários.", texto: <>Use a mediana ({formatBRL(p50)}) como base e a média ({formatBRL(pin.dailyAvg)}) como cenário de topo. Se o investimento só fecha no segundo, a margem de erro é pequena.</> },
            { titulo: "Coloque o preço real do imóvel.", texto: <>A rentabilidade anual e o prazo estimado de retorno dependem do valor de compra e da reforma, que mudam de prédio para prédio. O <LinkRadar to={linkSimuladorBairro("pinheiros")}>simulador do Radar</LinkRadar> já abre com Pinheiros e calcula os dois.</> },
            { titulo: "Inclua a reforma no investimento.", texto: <>No estudo da Bewild com {CONTRATOS_ANALISADOS} contratos de reforma completa em São Paulo, o orçamento mediano foi {formatBRL(ORCAMENTO_MEDIANO)} para {formatDecimal(AREA_MEDIANA_M2, 1)} m², e nenhum contrato ficou abaixo de {formatBRL(ORCAMENTO_MINIMO_BASE)}. O prazo em contrato vai de {PRAZO_DIAS_UTEIS_MIN} a {PRAZO_DIAS_UTEIS_MAX} dias úteis. <LinkExterno href={ARTIGOS_BEWILD.custoReforma.url}>Veja o estudo de custos de reforma</LinkExterno>.</> },
            { titulo: "Confirme as regras do prédio.", texto: <>A convenção do condomínio pode restringir a locação por temporada. Veja <LinkExterno href={ARTIGOS_BEWILD.lei.url}>o que a lei permite para studios no Airbnb em São Paulo</LinkExterno>.</> },
          ]}
        />

        <ChamadaFinal
          titulo="Faça a conta com o seu imóvel"
          texto="Simule Pinheiros com o preço e a metragem do studio que você está avaliando, e compare a mediana com a média do bairro."
          simularHref={linkSimuladorBairro("pinheiros")}
          simularRotulo="Simular Pinheiros"
        />

        <AvisoReceita className="mt-6" />

        <FontesMetodo
          itens={[
            <>Ocupação, diária média, quartis e anúncios: <LinkExterno href={fonte.url}>{fonte.title}</LinkExterno>, período {pin.period}, aprovado na base do Radar em {artigo.baseEm}. Demais bairros: páginas equivalentes da mesma fonte.</>,
            <>Receita mensal de referência = diária média × 30 × ocupação. Comparações usam os {bairrosObservados().length} bairros com dado próprio; Brooklin e Vila Olímpia usam aproximação pelo Itaim Bibi e ficam fora do ranking.</>,
            <>Custos: DRE padrão do guia e despesas de exemplo, hipóteses editáveis. Detalhes e dados abertos na <LinkRadar to="/metodologia">metodologia do Radar</LinkRadar>.</>,
            <>Reforma: estudo Bewild de out/2026, base de {CONTRATOS_ANALISADOS} contratos de reforma completa em São Paulo.</>,
          ]}
        />
      </CorpoArtigo>
    </>
  );
}
