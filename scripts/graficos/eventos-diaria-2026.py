"""Gráficos do estudo "Quais eventos mais sobem a diária do Airbnb em São Paulo".

Gera, a partir das linhas publicáveis de `radar_evento_efeitos` (recorte de até 1 quarto,
leitura de 16/11/2026), duas figuras em versão larga e de celular:

  02-interlagos-gp-x-lollapalooza(.webp | -m.webp)
  03-bairros-por-evento(.webp | -m.webp)

Uso: python3 scripts/graficos/eventos-diaria-2026.py
Precisa do Google Chrome (captura do HTML) e do Pillow (conversão para WebP).
Os números ficam aqui de propósito: são os mesmos do texto e das tabelas, e uma releitura
da fonte exige rever o texto junto. Linhas que não são publicáveis não entram.
"""
import pathlib, subprocess, tempfile
from PIL import Image

RAIZ = pathlib.Path(__file__).resolve().parents[2]
SAIDA = RAIZ / "public/conteudos/imagens/eventos-que-mais-sobem-diaria-airbnb-sao-paulo"
FONTE = (RAIZ / "public/fonts/source-serif-4-latin-variavel.woff2").as_uri()

# (efeito %, forte): forte = superou 99% das semanas comuns; senão, sinal mais fraco (passou na correção).
EF = {
    "BTS": {"Morumbi": (47.3, 1), "Jabaquara": (45.1, 1), "Santa Cecília": (43.1, 1), "Moema": (40.6, 1),
            "Santo Amaro": (39.5, 1), "Campo Belo": (36.4, 1), "Itaim Bibi": (36.2, 1), "Vila Mariana": (35.9, 1),
            "Brás": (35.3, 1), "Pinheiros": (34.8, 1), "Jardim Paulista": (34.2, 1), "Perdizes": (33.4, 1),
            "Ipiranga": (31.0, 1), "Consolação": (30.2, 1), "Sé": (28.3, 1), "Butantã": (26.6, 1),
            "Bela Vista": (25.3, 1), "Saúde": (23.6, 1), "Bom Retiro": (21.8, 1), "República": (21.5, 1),
            "Liberdade": (21.4, 1), "Santana": (17.1, 0), "Tatuapé": (15.6, 1)},
    "GP": {"Santo Amaro": (43.6, 1), "Itaim Bibi": (42.2, 1), "Moema": (41.7, 1), "Campo Belo": (35.3, 1),
           "Pinheiros": (30.6, 1), "Consolação": (28.1, 1), "Jardim Paulista": (27.7, 1), "Vila Mariana": (24.9, 1),
           "Butantã": (21.9, 1), "Saúde": (21.6, 1), "Jabaquara": (20.7, 0), "Bela Vista": (17.5, 1),
           "Ipiranga": (14.1, 1), "Santa Cecília": (13.7, 1), "República": (9.3, 0)},
    "Hospitalar": {"Jabaquara": (18.6, 0), "Liberdade": (11.5, 1), "Vila Mariana": (10.1, 1), "Saúde": (10.0, 0),
                   "Campo Belo": (9.3, 0), "Moema": (9.1, 0), "Itaim Bibi": (8.5, 0)},
    "Lollapalooza": {"Campo Belo": (11.2, 1), "Santo Amaro": (8.1, 0), "Pinheiros": (7.7, 0), "Vila Mariana": (7.5, 0)},
    "Carnaval": {},
}
BAIRROS = ["Barra Funda", "Bela Vista", "Bom Retiro", "Brás", "Butantã", "Campo Belo", "Consolação", "Ipiranga",
           "Itaim Bibi", "Jabaquara", "Jardim Paulista", "Lapa", "Liberdade", "Moema", "Mooca", "Morumbi", "Perdizes",
           "Pinheiros", "República", "Santa Cecília", "Santana", "Santo Amaro", "Saúde", "Sé", "Tatuapé", "Vila Mariana"]
AMOSTRA_PEQUENA = {"Mooca", "Bom Retiro", "Lapa"}

pct = lambda v: f"+{v:.1f}%".replace(".", ",")
CSS = f"""
@font-face{{font-family:"Source Serif 4";src:url("{FONTE}") format("woff2");font-weight:200 900}}
*{{box-sizing:border-box;margin:0}}
body{{background:#f3f2f2;color:#201e1d;font-family:"Source Serif 4",Georgia,serif;font-variant-numeric:tabular-nums}}
.rot{{letter-spacing:.08em;text-transform:uppercase;color:#5e5b5a;font-weight:600}}
h1{{font-weight:600;line-height:1.15}} .sub{{color:#4f4c4b;line-height:1.35}}
.pe{{color:#5e5b5a;border-top:1px solid #d9d6d5;line-height:1.4}} .pe b{{color:#201e1d}}
"""


def capturar(html: str, largura: int, nome: str):
    with tempfile.TemporaryDirectory() as d:
        arq = pathlib.Path(d) / "g.html"
        arq.write_text(html, encoding="utf-8")
        png = pathlib.Path(d) / "g.png"
        # Altura generosa; o recorte abaixo tira o papel que sobrar.
        subprocess.run(["google-chrome", "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
                        "--force-device-scale-factor=2", f"--window-size={largura},2400",
                        f"--screenshot={png}", arq.as_uri()], check=True, capture_output=True)
        img = Image.open(png).convert("RGB")
        # Recorta na marca de fim (último pixel não papel) + margem.
        fundo = Image.new("RGB", img.size, (243, 242, 242))
        from PIL import ImageChops
        caixa = ImageChops.difference(img, fundo).getbbox()
        alto = min(img.height, caixa[3] + 2 * 28) if caixa else img.height
        img = img.crop((0, 0, img.width, alto))
        SAIDA.mkdir(parents=True, exist_ok=True)
        img.save(SAIDA / nome, "WEBP", quality=88, method=6)
        print(nome, img.size)


def interlagos(celular: bool) -> str:
    linhas = sorted(EF["GP"].items(), key=lambda kv: -kv[1][0])
    escala = (165 if celular else 520) / 45
    s = dict(pad="20px 16px 16px" if celular else "40px 44px 32px", h1="22px" if celular else "32px",
             sub="15px" if celular else "18px", rot="12px" if celular else "14px", nome="14px" if celular else "17px",
             col="104px" if celular else "190px", v="13px" if celular else "15px", pe="12px" if celular else "14px",
             bar="12px" if celular else "16px")
    corpo = []
    for bairro, (gp, gpf) in linhas:
        lo = EF["Lollapalooza"].get(bairro)
        def barra(valor, forte, cor_forte, cor_fraca, rotulo):
            if valor is None:
                return f'<div class="l"><span class="nd">{rotulo}: sem alta medida</span></div>'
            estilo = f"background:{cor_forte}" if forte else f"background:{cor_fraca};outline:1.5px dashed {cor_forte};outline-offset:-1.5px"
            extra = "" if forte else ' <span class="fr">sinal mais fraco</span>'
            return (f'<div class="l"><div class="b" style="width:{valor * escala:.1f}px;{estilo}"></div>'
                    f'<span class="v">{pct(valor)}</span>{extra}</div>')
        corpo.append(f'<div class="nome">{bairro}</div><div>{barra(gp, gpf, "#006a8a", "#b8dde9", "GP")}'
                     f'{barra(lo[0] if lo else None, lo[1] if lo else 1, "#b0560f", "#f1d3bb", "Lollapalooza")}</div>')
    titulo = ("Mesmo autódromo, efeito diferente: alta medida em 13 bairros no GP e em 1 no Lollapalooza"
              if celular else "Mesmo autódromo, efeito diferente: o GP teve alta medida em 13 bairros; o Lollapalooza, em 1")
    return f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>{CSS}
body{{padding:{s['pad']}}} .rot{{font-size:{s['rot']}}} h1{{font-size:{s['h1']};margin-top:8px}} .sub{{font-size:{s['sub']};margin-top:8px}}
.leg{{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:14px;font-size:{s['v']};color:#4f4c4b}} .leg i{{display:inline-block;width:14px;height:10px;margin-right:6px;vertical-align:baseline}}
.g{{display:grid;grid-template-columns:{s['col']} 1fr;column-gap:12px;row-gap:12px;margin-top:18px;align-items:center}}
.nome{{font-size:{s['nome']};font-weight:600;line-height:1.15}}
.l{{display:flex;align-items:center;gap:8px;min-height:{s['bar']};margin:2px 0}} .b{{height:{s['bar']};border-radius:1px}}
.v{{font-size:{s['v']};font-weight:700}} .fr,.nd{{font-size:{s['v']};color:#5e5b5a;white-space:nowrap}}
.pe{{font-size:{s['pe']};margin-top:20px;padding-top:10px}}</style></head><body>
<p class="rot">Fig. 2 · Radar Bewild</p><h1>{titulo}</h1>
<p class="sub">Alta da diária de studios nas noites de cada evento de 2026, nos 15 bairros com alta no GP. Mesmo local, mesmo número de noites.</p>
<p class="leg"><span><i style="background:#006a8a"></i>GP de F1, 06 a 08/11</span><span><i style="background:#b0560f"></i>Lollapalooza, 20 a 22/03</span><span><i style="background:#b8dde9;outline:1.5px dashed #006a8a;outline-offset:-1.5px"></i>tracejado: sinal mais fraco</span></p>
<div class="g">{''.join(corpo)}</div>
<p class="pe">Fonte: diária estimada pela AirDNA, anúncios de até 1 quarto, leitura de 16/11/2026; cálculo do Radar Bewild. Uma edição por evento. <b>radarbewild.com.br/eventos</b></p>
</body></html>"""


def grade(celular: bool) -> str:
    eventos = [("BTS", "BTS no MorumBIS", "BTS"), ("GP", "GP de F1", "GP"), ("Hospitalar", "Hospitalar", "Hosp."),
               ("Lollapalooza", "Lollapalooza", "Lolla"), ("Carnaval", "Carnaval", "Carn.")]
    def n_eventos(b): return sum(1 for e, _, _ in eventos if b in EF[e])
    ordem = sorted(BAIRROS, key=lambda b: (-n_eventos(b), -(EF["BTS"].get(b, (0, 0))[0])))
    s = dict(pad="20px 8px 16px 12px" if celular else "40px 44px 32px", h1="22px" if celular else "32px",
             sub="15px" if celular else "18px", rot="12px" if celular else "14px", nome="13px" if celular else "16px",
             col="94px" if celular else "200px", cel="52px" if celular else "128px", v="11.5px" if celular else "15px",
             pe="12px" if celular else "14px", alt="26px" if celular else "30px")
    cab = "".join(f'<div class="ce cab">{curto if celular else longo}</div>' for _, longo, curto in eventos)
    linhas = []
    for b in ordem:
        nome = b + ("*" if b in AMOSTRA_PEQUENA else "")
        celulas = []
        for e, _, _ in eventos:
            v = EF[e].get(b)
            if not v:
                celulas.append('<div class="ce vz">–</div>')
            elif v[1]:
                celulas.append(f'<div class="ce fo">{pct(v[0])}</div>')
            else:
                celulas.append(f'<div class="ce fa">{pct(v[0])}°</div>')
        linhas.append(f'<div class="nome">{nome}</div>{"".join(celulas)}')
    titulo = "O show do BTS subiu a diária em quase toda a cidade; Hospitalar e Lollapalooza, em poucos bairros"
    return f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>{CSS}
body{{padding:{s['pad']}}} .rot{{font-size:{s['rot']}}} h1{{font-size:{s['h1']};margin-top:8px}} .sub{{font-size:{s['sub']};margin-top:8px}}
.g{{display:grid;grid-template-columns:{s['col']} repeat(5,{s['cel']});gap:3px;margin-top:18px;align-items:stretch}}
.nome{{font-size:{s['nome']};font-weight:600;display:flex;align-items:center;min-height:{s['alt']}}}
.ce{{font-size:{s['v']};font-weight:700;display:flex;align-items:center;justify-content:center;border-radius:1px}}
.cab{{font-weight:600;color:#4f4c4b;text-align:center;line-height:1.15;padding-bottom:4px;align-items:flex-end}}
.fo{{background:#006a8a;color:#fff}} .fa{{background:#b8dde9;color:#201e1d}} .vz{{background:#e8e6e5;color:#8a8685;font-weight:400}}
.leg{{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:12px;font-size:{s['v']};color:#4f4c4b}} .leg i{{display:inline-block;width:14px;height:10px;margin-right:6px}}
.pe{{font-size:{s['pe']};margin-top:18px;padding-top:10px}}</style></head><body>
<p class="rot">Fig. 3 · Radar Bewild</p><h1>{titulo}</h1>
<p class="sub">Alta da diária de studios nas noites de cada evento de 2026, por bairro. Bairros em ordem de quantos eventos subiram a diária.</p>
<p class="leg"><span><i style="background:#006a8a"></i>alta medida</span><span><i style="background:#b8dde9"></i>° sinal mais fraco</span><span><i style="background:#e8e6e5"></i>– sem alta medida</span></p>
<div class="g"><div></div>{cab}{''.join(linhas)}</div>
<p class="pe">* Menos de 200 anúncios na base do Radar: leia com cautela. Fonte: diária estimada pela AirDNA, anúncios de até 1 quarto, leitura de 16/11/2026; cálculo do Radar Bewild. Uma edição por evento. <b>radarbewild.com.br/eventos</b></p>
</body></html>"""


if __name__ == "__main__":
    capturar(interlagos(False), 960, "02-interlagos-gp-x-lollapalooza.webp")
    capturar(interlagos(True), 390, "02-interlagos-gp-x-lollapalooza-m.webp")
    capturar(grade(False), 960, "03-bairros-por-evento.webp")
    capturar(grade(True), 390, "03-bairros-por-evento-m.webp")
