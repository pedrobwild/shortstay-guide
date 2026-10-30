# Empreendimentos em destaque — carga de 30/10/2026

Catálogo público em `/empreendimentos` (decisão do Pedro, 30/10/2026: banco + admin, todos os empreendimentos das pastas de clientes 100 a 236, só o selo "A Bewild já atua neste prédio", fotos autorizadas enviadas pelo admin). Os nomes vieram das pastas de clientes no Drive; **nenhum nome de cliente, número de unidade, contrato ou valor entra no banco nem neste registro.**

## Como os dados foram levantados

- 76 empreendimentos distintos (as pastas 187, 205 e 214 não têm nome de prédio).
- Pesquisa na web em 30/10/2026, com bairro, endereço, incorporadora, situação, entrega, unidades e até 6 diferenciais reescritos (sem copiar texto nem imagem). Fonte de cada linha em `fonte_url`: 11 páginas oficiais de incorporadora e o resto em portais (apto.vc, MySide, QuintoAndar, Lopes, imprensa). Datas de entrega e metragens divergem entre portais em vários casos; vale a fonte indicada.
- Carga por SQL direto (`docs/sql/empreendimentos-2026-10-30.sql`): **65 publicados** (confirmados e com fonte) e **11 em rascunho**.

## Em rascunho (conferir no /admin/empreendimentos)

| Empreendimento | Motivo |
|---|---|
| Balkon Campo Belo | Balkon Campo Belo só tem apartamentos grandes; a pasta pode ser do Go Balkon (outro prédio da Even no bairro). |
| Nex One Vila Nova | "Nex One Vila Nova" e "Next Vila Nova" são prédios diferentes; pode ainda ser o Nex One Pereira Coutinho (mesma avenida). Conferir o endereço no contrato. |
| Metrocasa Paulista | Uma fonte só, sem número; bairro incerto (Vila Mariana, Paraíso ou Jardim Paulista). |
| Villa Studios – Milano Lifestyle by Versace Home | O nome da pasta não bate exatamente com a torre de studios da Lavvi encontrada; entregas divergentes. |
| Nex One Estação Perdizes | Não existe "Nex One Sumaré"; o candidato é o Nex One Estação Perdizes (Av. Sumaré, 85). Conferir o endereço. |
| Fortune Residence | Único "Fortune Residence" achado é um prédio de flats de cerca de 1990, sem incorporadora. |
| Mobi One | "Mobi One" é uma linha com vários prédios; a pasta não diz o bairro. |
| Zero11 | "Zero11" só aparece no QuintoAndar, com endereços conflitantes e sem incorporadora. |
| Le Jardin | Nenhum "Le Jardin" com studios em SP; candidatos: Le Jardin Ibirapuera (Eztec) e Le Jardin Cyrela by YOO. |
| Helbor Patteo Klabin | Complexo Patteo Klabin tem dois prédios; se a unidade é studio, deve ser o Grand Home Patteo Klabin (Rua Vergueiro). |
| Mapp Barra Funda | O mais parecido é o "Mapp Barra Funda" (Mundo Apto), com grafia diferente e uma só fonte. |

## Publicados com ponto de atenção

- **Do It Pinheiros**: a incorporadora informa que é integralmente HIS2 (limite de renda para compra).
- **ON Cardoso de Melo**: parte das unidades é HIS-2, com regras de renda e de locação.
- **Urban Tatuapé**: o portal indica Minha Casa Minha Vida.
- **The Collection Vila Clementino**: a pesquisa encontrou indicação de unidades HIS/HMP; conferir.
- **Infinity Brooklin**: só apartamentos de 143 a 337 m² (sem studios); conferir se a pasta é desse prédio.
- **Península Vila Madalena**: só unidades de 155 m² ou mais (sem studios); conferir.
- **High Line Tatuapé**: só 2 e 3 quartos; conferir.
- **Liberty Santo Amaro**: só 2 quartos; conferir.
- **Modo Pompeia**: a fonte não cita studios; conferir.
- **Galeno 65**: incorporadora divergente entre portais (V.Lume ou Munte): campo vazio.
- **Dom Brás**: incorporadora não confirmada: campo vazio.
- **LM Urban Flex Bela Cintra**: as três grafias da pasta ("Urban Flex", "LM Urban Flex", "LM Urban Flex Flats Bela Cintra") são o mesmo prédio.
- **REM ID**: as três grafias "REM ID" foram tratadas como o mesmo prédio (Praça Cornélia, 50); a REM tem outro prédio no bairro, o Alta Romana, de 2 e 3 quartos.

## Regras da tela

- Ordem alfabética, sem ranking nem "recomendado"; aviso fixo de que não é recomendação de compra nem anúncio de venda.
- Números do bairro só quando o bairro está na base do Radar (mesmos números de `/bairro/*`, com a natureza do dado e o aviso de amostra); bairro fora da base não recebe número de bairro vizinho.
- Sem foto: ilustração neutra com o nome. Foto só com direito de uso (da Bewild ou cedida pela incorporadora), enviada pelo admin.
