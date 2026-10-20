import { useMemo, useState } from "react";
import type { BairroCurado } from "@/data/bairrosCurados";
import { useLargura } from "@/components/estudo/graficos/useLargura";
import {
  LAT0, LNG0, PX_POR_GRAU_LNG, PX_POR_KM, latDeY, linhasGrade, lngDeX, passoGrade, pontosMapa, posicionarRotulos, projetar,
  rotuloGrau, type IndicadorMapa, type PontoMapa,
} from "@/lib/estudoMapa";
import { temAmostraPequena } from "@/lib/estudo";
import { CONTORNO, COR_CLASSE, GRADE, TINTA_70, rotuloAcessivel } from "@/components/estudo/graficos/mapaSvgTextos";
import { cn } from "@/lib/utils";

/**
 * Fig. 1 do /mapa: os bairros nas coordenadas reais (bairrosGeo.ts), em projeção
 * equirretangular centrada em 23,6° S a 40 px/km, reduzida para caber na largura.
 * Grade de latitude e longitude, barra de 2 km e norte. Cor = indicador em 4 classes
 * por quartil; área = amostra (anúncios); aproximação com tamanho fixo e contorno
 * tracejado. O SVG é decorativo (aria-hidden): cada círculo tem um <button> por cima,
 * com aria-label, e a página traz a tabela equivalente.
 */
export default function MapaBairrosSvg<T extends BairroCurado>({
  bairros,
  indicador,
  selecionado,
  onSelecionar,
}: {
  bairros: T[];
  indicador: IndicadorMapa;
  selecionado: string | null;
  onSelecionar: (nome: string) => void;
}) {
  const { ref, largura } = useLargura<HTMLDivElement>(720);
  const compacto = largura < 560;
  const [realce, setRealce] = useState<string | null>(null);

  const desenho = useMemo(() => {
    const { pontos } = pontosMapa(bairros, indicador, compacto ? { rMax: 15, rMin: 3, raioAproximacao: 6 } : { rMax: 28, rMin: 4, raioAproximacao: 10 });
    if (!pontos.length) return null;
    const xs = pontos.map((p) => p.x), ys = pontos.map((p) => p.y);
    const bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys), by1 = Math.max(...ys);
    const mx = compacto ? 30 : 78;
    const topo = compacto ? 34 : 44;
    const base = 60;
    const alturaMax = compacto ? 560 : 820;
    const k = Math.min((largura - 2 * mx) / (bx1 - bx0), (alturaMax - topo - base) / (by1 - by0));
    const altura = Math.round((by1 - by0) * k + topo + base);
    const ox = (largura - (bx1 - bx0) * k) / 2;
    const tela = (p: { x: number; y: number }) => ({ sx: ox + (p.x - bx0) * k, sy: topo + (p.y - by0) * k });
    const pts = pontos.map((p) => ({ ...p, ...tela(p) }));

    // Grade: a área desenhada inteira, convertida de volta em graus.
    const passo = passoGrade(PX_POR_GRAU_LNG * k);
    const lngMin = lngDeX(bx0 - ox / k), lngMax = lngDeX(bx0 + (largura - ox) / k);
    const latMax = latDeY(by0 - topo / k), latMin = latDeY(by0 + (altura - topo) / k);
    const xDeLng = (lng: number) => tela(projetar(LAT0, lng)).sx;
    const yDeLat = (lat: number) => tela(projetar(lat, LNG0)).sy;
    const verticais = linhasGrade(lngMin, lngMax, passo).map((lng) => ({ lng, x: xDeLng(lng) })).filter((l) => l.x > 2 && l.x < largura - 2);
    const horizontais = linhasGrade(latMin, latMax, passo).map((lat) => ({ lat, y: yDeLat(lat) })).filter((l) => l.y > 2 && l.y < altura - base + 8);

    return { pts, altura, verticais, horizontais, k, base, compacto };
  }, [bairros, indicador, largura, compacto]);

  const fonte = compacto ? 11 : 12.5;
  const rotulos = useMemo(() => {
    if (!desenho) return new Map();
    return posicionarRotulos(
      desenho.pts.map((p) => ({
        id: p.bairro.name, x: p.sx, y: p.sy, r: p.bairro.name === selecionado ? p.r + 5 : p.r, texto: p.bairro.name, lado: p.lado,
        // Selecionado e realce sempre com rótulo (≥ 1000); depois as aproximações e as maiores amostras (n/10 < 1000).
        prioridade: p.bairro.name === selecionado ? 2000 : p.bairro.name === realce ? 1000 : p.aproximacao ? 900 : (p.bairro.activeListings ?? 0) / 10,
      })),
      fonte,
      { x: 0, y: 0, w: largura, h: desenho.altura - desenho.base + 6 },
      3,
      [
        // Rótulos de latitude (canto esquerdo de cada linha) e a seta de norte.
        ...desenho.horizontais.map((l) => ({ x: 0, y: l.y - 16, w: 62, h: 15 })),
        { x: largura - 36, y: 4, w: 32, h: 40 },
      ],
    );
  }, [desenho, selecionado, realce, fonte, largura]);

  if (!desenho) return <div ref={ref} className="e-apoio py-8">Nenhum bairro com posição no mapa.</div>;
  const { pts, altura, verticais, horizontais, k, base } = desenho;
  const km2 = 2 * PX_POR_KM * k;
  const ordemTexto = [...pts].sort((a, b) => (a.bairro.name === selecionado ? 1 : 0) - (b.bairro.name === selecionado ? 1 : 0));

  const estilo = (p: PontoMapa<T>) => {
    const sel = p.bairro.name === selecionado;
    const cor = sel ? "hsl(var(--magenta))" : COR_CLASSE[p.classe];
    if (p.aproximacao) {
      return { fill: cor, fillOpacity: 0.28, stroke: sel ? "hsl(var(--magenta-700))" : CONTORNO, strokeWidth: sel ? 2 : 1.25, strokeDasharray: "3 2" };
    }
    return { fill: cor, fillOpacity: 1, stroke: sel ? "hsl(var(--magenta-700))" : CONTORNO, strokeWidth: sel ? 2 : 1 };
  };

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height: altura }}>
      <svg width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`} aria-hidden="true" className="absolute inset-0 block">
        <rect x={0.5} y={0.5} width={largura - 1} height={altura - 1} fill="none" stroke={GRADE} />
        {/* Grade de latitude e longitude */}
        {verticais.map((l) => (
          <g key={`v${l.lng}`}>
            <line x1={l.x} x2={l.x} y1={0} y2={altura - base + 8} stroke={GRADE} />
            {l.x > 34 && l.x < largura - 34 && <text x={l.x} y={altura - base + 24} textAnchor="middle" fontSize={11} fill={TINTA_70} className="tabular-nums">{rotuloGrau(l.lng, "lng")}</text>}
          </g>
        ))}
        {horizontais.map((l) => (
          <g key={`h${l.lat}`}>
            <line x1={0} x2={largura} y1={l.y} y2={l.y} stroke={GRADE} />
            <text x={4} y={l.y - 4} fontSize={11} fill={TINTA_70} className="tabular-nums">{rotuloGrau(l.lat, "lat")}</text>
          </g>
        ))}

        {/* Círculos: maiores primeiro, para os menores ficarem por cima */}
        {[...pts.filter((p) => p.bairro.name !== selecionado), ...pts.filter((p) => p.bairro.name === selecionado)].map((p) => {
          const e = estilo(p);
          const emRealce = realce === p.bairro.name && p.bairro.name !== selecionado;
          return (
            <circle
              key={p.bairro.name}
              cx={p.sx}
              cy={p.sy}
              r={p.r}
              fill={e.fill}
              fillOpacity={e.fillOpacity}
              stroke={emRealce ? "hsl(var(--foreground))" : e.stroke}
              strokeWidth={emRealce ? 2 : e.strokeWidth}
              strokeDasharray={e.strokeDasharray}
            />
          );
        })}

        {/* Anel em volta do selecionado: o círculo pequeno (amostra pequena) continua visível */}
        {pts.filter((p) => p.bairro.name === selecionado).map((p) => (
          <circle key="anel" cx={p.sx} cy={p.sy} r={p.r + 5} fill="none" stroke="hsl(var(--magenta))" strokeWidth={1.5} />
        ))}

        {/* Rótulos com halo de papel; o selecionado por último, em magenta */}
        {ordemTexto.map((p) => {
          const r = rotulos.get(p.bairro.name);
          if (!r) return null;
          const sel = p.bairro.name === selecionado;
          return (
            <text
              key={`t${p.bairro.name}`}
              x={r.x}
              y={r.y}
              textAnchor={r.ancora}
              fontSize={fonte}
              fontWeight={sel ? 700 : 600}
              fill={sel ? "hsl(var(--magenta-700))" : "hsl(var(--foreground))"}
              stroke="hsl(var(--background))"
              strokeWidth={3}
              strokeLinejoin="round"
              style={{ paintOrder: "stroke" }}
            >
              {p.bairro.name}
              {temAmostraPequena(p.bairro) && <tspan fill="hsl(var(--magenta-700))" fontStyle="italic"> *</tspan>}
            </text>
          );
        })}

        {/* Barra de escala (2 km) e norte */}
        <g transform={`translate(${largura - km2 - 12}, ${altura - 12})`}>
          <rect x={0} y={0} width={km2 / 2} height={4} fill="hsl(var(--foreground))" />
          <rect x={km2 / 2} y={0} width={km2 / 2} height={4} fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth={1} />
          {km2 >= 56 && <text x={0} y={-4} fontSize={11} fill={TINTA_70}>0</text>}
          <text x={km2} y={-4} fontSize={11} fill={TINTA_70} textAnchor="end">2 km</text>
        </g>
        <g transform={`translate(${largura - 22}, ${14})`}>
          <path d="M0 0 L6 16 L0 12 L-6 16 Z" fill="hsl(var(--foreground))" />
          <text x={0} y={28} fontSize={11} fontWeight={600} textAnchor="middle" fill="hsl(var(--foreground))">N</text>
        </g>
      </svg>

      {/* Um botão por círculo (alvo de 44px), na mesma ordem de desenho */}
      {pts.map((p) => {
        const sel = p.bairro.name === selecionado;
        return (
          <button
            key={`b${p.bairro.name}`}
            type="button"
            aria-label={rotuloAcessivel(p.bairro, indicador)}
            aria-pressed={sel}
            title={rotuloAcessivel(p.bairro, indicador)}
            onClick={() => onSelecionar(p.bairro.name)}
            onMouseEnter={() => setRealce(p.bairro.name)}
            onMouseLeave={() => setRealce((r) => (r === p.bairro.name ? null : r))}
            onFocus={() => setRealce(p.bairro.name)}
            onBlur={() => setRealce((r) => (r === p.bairro.name ? null : r))}
            className={cn("absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent", "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ciano")}
            style={{ left: p.sx, top: p.sy, width: Math.max(44, 2 * p.r + 4), height: Math.max(44, 2 * p.r + 4) }}
          />
        );
      })}
    </div>
  );
}
