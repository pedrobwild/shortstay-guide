import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMap, { Marker, Popup, NavigationControl, Source, Layer, type MapRef } from "react-map-gl/maplibre";
import type { MapLayerMouseEvent, GeoJSONSource, ExpressionSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { BairroItem } from "@/data/guide-data";
import { geoBairro, type LadoRotulo } from "@/data/bairrosGeo";
import { POI_CATEGORIES, type POICategoryKey } from "@/data/mapaBairrosData";
import { receitaMensalReferencia } from "@/data/bairrosCurados";
import { avisoAmostraBairro, estiloMarcador, naturezaBairro } from "@/lib/radarUi";
import { formatBRL, formatPercent } from "@/lib/numberFormat";
import { cn } from "@/lib/utils";

/**
 * Mapa de bairros do Radar sobre MapLibre: um marcador por bairro da base
 * (tamanho = anúncios na amostra; cor = receita mensal de referência; estimativa
 * com contorno tracejado), rótulo ao lado, bairro selecionado com anel escuro e
 * bairros fora do filtro esmaecidos (não somem). Camadas opcionais: polígonos,
 * mapa de calor de demanda, agrupamento de anúncios, metrô e pontos de interesse.
 */

const MAP_STYLE = "https://api.maptiler.com/maps/019cc06d-fb8e-741d-b158-a17a30e87c08/style.json?key=AI17dHeoeJx6rUC1KlSL";
const SP_BOUNDS: [[number, number], [number, number]] = [[-46.82, -23.68], [-46.55, -23.45]];

export interface CamadasMapa {
  poligonos: boolean;
  calor: boolean;
  clusters: boolean;
  metro: boolean;
  pois: POICategoryKey[];
}
export const CAMADAS_INICIAIS: CamadasMapa = { poligonos: true, calor: false, clusters: false, metro: false, pois: [] };

/** Polígonos do arquivo geográfico cujo nome difere do bairro da base. */
const POLIGONO_PARA_BAIRRO: Record<string, string> = { Jardins: "Jardim Paulista", "Paulista / Consolação": "Consolação" };

/** Lê um token HSL de index.css ("210 70% 25%") e devolve "hsla(210, 70%, 25%, a)" para as camadas do MapLibre. */
function corToken(nome: string, alfa = 1): string {
  if (typeof window === "undefined") return "hsla(210, 70%, 25%, 1)";
  const bruto = getComputedStyle(document.documentElement).getPropertyValue(`--${nome}`).trim();
  const [h, s, l] = bruto.split(/\s+/);
  return h && s && l ? `hsla(${h}, ${s}, ${l}, ${alfa})` : `hsla(210, 70%, 25%, ${alfa})`;
}

const POSICAO_ROTULO: Record<LadoRotulo, React.CSSProperties> = {
  direita: { left: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" },
  esquerda: { right: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" },
  abaixo: { top: "calc(100% + 3px)", left: "50%", transform: "translateX(-50%)" },
  acima: { bottom: "calc(100% + 3px)", left: "50%", transform: "translateX(-50%)" },
};

export interface MapaRadarProps {
  bairros: BairroItem[];
  selecionado: string | null;
  /** Nomes que passam nos filtros; os demais ficam com opacidade 0,2. */
  visiveis: Set<string>;
  /** Bairros em destaque (ex.: perto de um evento). */
  destaque?: string[];
  camadas: CamadasMapa;
  onSelecionar: (nome: string) => void;
  /** Celular: marcadores e rótulos menores, sem botões de zoom (pinça). */
  compacto?: boolean;
  /** Pedido para centralizar num bairro (o contador repete o pedido para o mesmo bairro). */
  centralizar?: { nome: string; n: number } | null;
  /** Folga do enquadramento (px) para não esconder marcadores sob painéis. */
  folga?: { top: number; bottom: number; left: number; right: number };
}

export default function MapaRadar({
  bairros, selecionado, visiveis, destaque = [], camadas, onSelecionar, compacto = false, centralizar, folga = { top: 48, bottom: 48, left: 48, right: 48 },
}: MapaRadarProps) {
  const mapRef = useRef<MapRef>(null);
  const [poisGeoJSON, setPoisGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [hoveredPOI, setHoveredPOI] = useState<{ name: string; category: string; neighborhood: string; lng: number; lat: number } | null>(null);
  const [hoveredStation, setHoveredStation] = useState<{ name: string; line: string; lng: number; lat: number } | null>(null);
  const [hoveredPoly, setHoveredPoly] = useState<{ nome: string; lng: number; lat: number } | null>(null);
  // No celular os rótulos só aparecem com zoom suficiente para não se sobreporem (o selecionado sempre aparece).
  const [zoom, setZoom] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => { const z = mapRef.current?.getZoom(); if (z) setZoom(z); }, 0);
    return () => window.clearTimeout(id);
  }, []);
  const ZOOM_ROTULOS_CELULAR = 12.2;

  const comGeo = useMemo(() => bairros.flatMap((b) => { const g = geoBairro(b.name); return g ? [{ b, g }] : []; }), [bairros]);
  const limites = useMemo<[[number, number], [number, number]]>(() => {
    if (!comGeo.length) return [[-46.72, -23.62], [-46.59, -23.53]];
    const lngs = comGeo.map((x) => x.g.lng), lats = comGeo.map((x) => x.g.lat);
    return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
  }, [comGeo]);
  const nomesBase = useMemo(() => new Set(bairros.map((b) => b.name)), [bairros]);
  // Cores das camadas a partir dos tokens de index.css (o MapLibre não lê variáveis CSS).
  const cores = useMemo(() => ({
    linha: corToken("primary", 0.35),
    preenchimento: corToken("primary", 0.04),
    contorno: corToken("card"),
    textoSobreCor: corToken("primary-foreground"),
    neutro: corToken("muted-foreground"),
    agrupamento: corToken("primary", 0.85),
    escala: [1, 2, 3, 4, 5].map((n) => (alfa: number) => corToken(`escala-${n}`, alfa)),
  }), []);

  // Pontos de interesse só são baixados quando a camada é ligada.
  useEffect(() => {
    if (!camadas.pois.length || poisGeoJSON) return;
    fetch("/geo/pois.geojson").then((r) => r.json()).then(setPoisGeoJSON).catch(() => {});
  }, [camadas.pois.length, poisGeoJSON]);

  // Centraliza no bairro pedido (busca, link com ?bairro=) sem mudar o zoom para menos.
  useEffect(() => {
    if (!centralizar || !mapRef.current) return;
    const g = geoBairro(centralizar.nome);
    if (!g) return;
    const mapa = mapRef.current;
    const camera = { center: [g.lng, g.lat] as [number, number], zoom: Math.max(mapa.getZoom(), 12.5), padding: folga };
    // Com o estilo ainda carregando (ou indisponível), a animação não roda: posiciona direto.
    if (mapa.isStyleLoaded()) mapa.easeTo({ ...camera, duration: 600 });
    else mapa.jumpTo(camera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centralizar?.n]);

  const bairroDoPoligono = useCallback((nome: string) => {
    const alvo = POLIGONO_PARA_BAIRRO[nome] ?? nome;
    return nomesBase.has(alvo) ? alvo : null;
  }, [nomesBase]);

  const onClusterClick = useCallback((e: MapLayerMouseEvent, fonte: string, zoomMax = 17) => {
    const mapa = mapRef.current;
    const feature = e.features?.[0];
    if (!mapa || !feature) return;
    const clusterId = feature.properties?.cluster_id;
    const source = mapa.getSource(fonte) as GeoJSONSource | undefined;
    if (source && clusterId != null) {
      source.getClusterExpansionZoom(clusterId).then((zoom) => {
        const geom = feature.geometry as GeoJSON.Point;
        mapa.easeTo({ center: geom.coordinates as [number, number], zoom: Math.min(zoom, zoomMax), duration: 500 });
      });
    }
  }, []);

  const poisFiltrados = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!poisGeoJSON || !camadas.pois.length) return null;
    return {
      type: "FeatureCollection",
      features: poisGeoJSON.features.filter((f) => camadas.pois.includes((f.properties as { category?: string } | null)?.category as POICategoryKey)),
    };
  }, [poisGeoJSON, camadas.pois]);
  const corPoi = useMemo(() => {
    const expr = ["match", ["get", "category"]] as unknown[];
    POI_CATEGORIES.forEach((c) => { expr.push(c.key, c.color); });
    expr.push(cores.neutro);
    return expr as ExpressionSpecification;
  }, [cores]);

  const camadasInterativas = [
    ...(camadas.poligonos ? ["neighborhood-fill"] : []),
    ...(camadas.metro ? ["metro-stations-circle"] : []),
    ...(camadas.clusters ? ["cluster-circles"] : []),
    ...(poisFiltrados ? ["poi-unclustered", "poi-clusters"] : []),
  ];

  return (
    <div className="radar-mapa mapa-esquema absolute inset-0" style={{ ["--grade" as string]: "48px" } as React.CSSProperties}>
      <ReactMap
        ref={mapRef}
        initialViewState={{ bounds: limites, fitBoundsOptions: { padding: folga } }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        minZoom={10}
        maxZoom={17}
        maxBounds={SP_BOUNDS}
        attributionControl={{ compact: true }}
        interactiveLayerIds={camadasInterativas}
        onMouseMove={(e) => {
          const f = e.features ?? [];
          const poly = f.find((x) => x.layer?.id === "neighborhood-fill");
          const nomePoly = poly?.properties?.name ? bairroDoPoligono(String(poly.properties.name)) : null;
          setHoveredPoly(nomePoly ? { nome: nomePoly, lng: e.lngLat.lng, lat: e.lngLat.lat } : null);
          const est = f.find((x) => x.layer?.id === "metro-stations-circle");
          setHoveredStation(est ? { name: est.properties?.name || "", line: est.properties?.line || "", lng: e.lngLat.lng, lat: e.lngLat.lat } : null);
          const poi = f.find((x) => x.layer?.id === "poi-unclustered");
          setHoveredPOI(poi ? { name: poi.properties?.name || "", category: poi.properties?.category || "", neighborhood: poi.properties?.neighborhood || "", lng: e.lngLat.lng, lat: e.lngLat.lat } : null);
          const clicavel = Boolean(nomePoly || est || poi || f.some((x) => x.layer?.id === "cluster-circles" || x.layer?.id === "poi-clusters"));
          const canvas = mapRef.current?.getCanvas();
          if (canvas) canvas.style.cursor = clicavel ? "pointer" : "";
        }}
        onMouseLeave={() => { setHoveredPoly(null); setHoveredStation(null); setHoveredPOI(null); }}
        onZoomEnd={(e) => setZoom(e.viewState.zoom)}
        onClick={(e) => {
          const f = e.features ?? [];
          const cluster = f.find((x) => x.layer?.id === "cluster-circles");
          if (cluster) return onClusterClick({ ...e, features: [cluster] } as MapLayerMouseEvent, "clusters-source");
          const poiCluster = f.find((x) => x.layer?.id === "poi-clusters");
          if (poiCluster) return onClusterClick({ ...e, features: [poiCluster] } as MapLayerMouseEvent, "pois-clustered", 16);
          const poly = f.find((x) => x.layer?.id === "neighborhood-fill");
          const nome = poly?.properties?.name ? bairroDoPoligono(String(poly.properties.name)) : null;
          if (nome) onSelecionar(nome);
        }}
      >
        {!compacto && <NavigationControl position="top-right" showCompass={false} />}

        {camadas.poligonos && (
          <Source id="neighborhoods-source" type="geojson" data="/geo/neighborhoods.geojson">
            <Layer id="neighborhood-fill" type="fill" paint={{ "fill-color": cores.preenchimento, "fill-opacity": 1 }} />
            <Layer id="neighborhood-outline" type="line" paint={{ "line-color": cores.linha, "line-width": 1.5, "line-dasharray": [3, 2] }} />
          </Source>
        )}

        {camadas.metro && (
          <>
            <Source id="metro-lines-source" type="geojson" data="/geo/metro-lines.geojson">
              <Layer id="metro-lines" type="line" paint={{ "line-color": ["get", "color"], "line-width": 3, "line-opacity": 0.6 }} />
            </Source>
            <Source id="metro-stations-source" type="geojson" data="/geo/metro-stations.geojson">
              <Layer id="metro-walk-radius" type="circle" paint={{
                "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 10, 3, 12, 12, 14, 48, 16, 192],
                "circle-color": ["get", "color"], "circle-opacity": 0.08, "circle-stroke-color": ["get", "color"], "circle-stroke-width": 1, "circle-stroke-opacity": 0.2,
              }} />
              <Layer id="metro-stations-circle" type="circle" paint={{ "circle-radius": 6, "circle-color": ["get", "color"], "circle-stroke-color": cores.contorno, "circle-stroke-width": 2 }} />
            </Source>
          </>
        )}

        {camadas.calor && (
          <Source id="heatmap-source" type="geojson" data="/geo/heatmap-points.geojson">
            <Layer id="heatmap-layer" type="heatmap" paint={{
              "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 50, 0, 100, 1],
              "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 15, 2],
              "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 20, 15, 40],
              "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, cores.escala[0](0), 0.2, cores.escala[0](0.4), 0.4, cores.escala[1](0.5), 0.6, cores.escala[2](0.6), 0.8, cores.escala[3](0.7), 1, cores.escala[4](0.8)],
              "heatmap-opacity": 0.7,
            }} />
          </Source>
        )}

        {camadas.clusters && (
          <Source id="clusters-source" type="geojson" data="/geo/clusters.geojson" cluster clusterMaxZoom={14} clusterRadius={50}>
            <Layer id="cluster-circles" type="circle" filter={["has", "point_count"]} paint={{
              "circle-color": ["step", ["get", "point_count"], cores.escala[2](0.75), 5, cores.escala[3](0.8), 15, cores.escala[4](0.85)],
              "circle-radius": ["step", ["get", "point_count"], 18, 5, 24, 15, 32], "circle-stroke-width": 2, "circle-stroke-color": cores.contorno,
            }} />
            <Layer id="cluster-count" type="symbol" filter={["has", "point_count"]} layout={{ "text-field": "{point_count_abbreviated}", "text-size": 12 }} paint={{ "text-color": cores.textoSobreCor }} />
            <Layer id="unclustered-point" type="circle" filter={["!", ["has", "point_count"]]} paint={{ "circle-color": cores.escala[2](0.6), "circle-radius": 5, "circle-stroke-width": 1, "circle-stroke-color": cores.contorno }} />
          </Source>
        )}

        {poisFiltrados && (
          <Source id="pois-clustered" type="geojson" data={poisFiltrados} cluster clusterRadius={40} clusterMaxZoom={14}>
            <Layer id="poi-clusters" type="circle" filter={["has", "point_count"]} paint={{
              "circle-color": cores.agrupamento, "circle-radius": ["step", ["get", "point_count"], 16, 5, 20, 10, 26], "circle-stroke-width": 2, "circle-stroke-color": cores.contorno,
            }} />
            <Layer id="poi-cluster-count" type="symbol" filter={["has", "point_count"]} layout={{ "text-field": "{point_count_abbreviated}", "text-size": 11 }} paint={{ "text-color": cores.textoSobreCor }} />
            <Layer id="poi-unclustered" type="circle" filter={["!", ["has", "point_count"]]} paint={{
              "circle-color": corPoi, "circle-radius": 6, "circle-stroke-width": 2, "circle-stroke-color": cores.contorno, "circle-opacity": 0.9,
            }} />
          </Source>
        )}

        {/* Um marcador por bairro da base */}
        {comGeo.map(({ b, g }) => {
          const sel = b.name === selecionado;
          const ativo = visiveis.has(b.name);
          const emDestaque = destaque.includes(b.name);
          const estilo = estiloMarcador(b, compacto ? 0.8 : 1);
          const estimativa = naturezaBairro(b) === "estimativa";
          const comRotulo = !compacto || sel || zoom >= ZOOM_ROTULOS_CELULAR;
          const anel = sel
            ? "0 0 0 3px hsl(var(--foreground))"
            : emDestaque ? "0 0 0 3px hsl(var(--estimate-border))" : "var(--shadow-marcador)";
          return (
            <Marker key={b.name} longitude={g.lng} latitude={g.lat} anchor="center" style={{ zIndex: sel ? 3 : ativo ? 2 : 1 }}>
              <div className="relative" style={{ width: estilo.width, height: estilo.height, opacity: ativo ? 1 : 0.2 }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSelecionar(b.name); }}
                  aria-pressed={sel}
                  aria-label={`${b.name}: diária ${formatBRL(b.dailyAvg)}, ocupação ${formatPercent(b.avgOccupancy, 0)}, receita de referência ${formatBRL(receitaMensalReferencia(b))}${estimativa ? ", estimativa Bewild" : ""}${avisoAmostraBairro(b) ? `, ${avisoAmostraBairro(b)}` : ""}`}
                  className="relative block h-full w-full cursor-pointer rounded-full p-0 transition-transform hover:scale-110 before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:content-['']"
                  style={{ ...estilo, boxSizing: "border-box", boxShadow: anel }}
                />
                {comRotulo && <span
                  className={cn(
                    "pointer-events-none absolute whitespace-nowrap font-body text-foreground",
                    compacto ? "text-[11px]" : "text-[13px]",
                    sel ? "font-bold" : "font-medium",
                  )}
                  style={{ ...POSICAO_ROTULO[g.lado], textShadow: "0 0 3px hsl(var(--card)), 0 0 3px hsl(var(--card)), 0 0 2px hsl(var(--card))" }}
                  aria-hidden="true"
                >
                  {b.name}
                </span>}
              </div>
            </Marker>
          );
        })}

        {hoveredPoly && !hoveredStation && !hoveredPOI && (
          <Popup longitude={hoveredPoly.lng} latitude={hoveredPoly.lat} offset={10} closeButton={false} closeOnClick={false} anchor="bottom">
            <p className="text-[12px] font-semibold text-foreground">{hoveredPoly.nome}</p>
            <p className="text-[11px] text-muted-foreground">Clique para ver no painel</p>
          </Popup>
        )}
        {hoveredStation && (
          <Popup longitude={hoveredStation.lng} latitude={hoveredStation.lat} offset={12} closeButton={false} closeOnClick={false} anchor="bottom">
            <p className="text-[11px] font-bold">{hoveredStation.name}</p>
            <p className="text-[10px] text-muted-foreground">{hoveredStation.line}</p>
          </Popup>
        )}
        {hoveredPOI && (
          <Popup longitude={hoveredPOI.lng} latitude={hoveredPOI.lat} offset={14} closeButton={false} closeOnClick={false} anchor="bottom">
            <p className="text-[11px] font-bold leading-tight text-foreground">{hoveredPOI.name}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {POI_CATEGORIES.find((c) => c.key === hoveredPOI.category)?.label ?? hoveredPOI.category} · {hoveredPOI.neighborhood}
            </p>
          </Popup>
        )}
      </ReactMap>
    </div>
  );
}
