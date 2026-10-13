# Pacote Radar Bewild: orçamento, consentimento e fontes

## O que será entregue
- Todos os contatos levam a **Peça seu orçamento**, em nova aba no site Bewild, com identificação do local do clique.
- Seção final sem formulário, com o título aprovado, apoio e acesso secundário para salvar cenários; rodapé com marca, privacidade e orçamento.
- Marca visível **Bewild** e questionário **Autoavaliação do investidor**, mantendo nomes internos e âncoras.
- Banner Aceitar/Recusar com escolha salva. GA4 e Meta só enviam eventos após aceitar; áreas privadas ficam excluídas.
- Imagem de compartilhamento de 1200×630 baseada na foto existente, com o texto aprovado em todas as páginas públicas.
- Afirmações sem fonte viram texto sem número ou usam fonte já aprovada; hipóteses e premissas ficam identificadas sem modificar valores de cálculo.

## Preservação e limites
- Não alterar linhas do banco, a base curada ou o case Pinheiros. Não publicar.
- Manter ferramentas, acesso e layout; remover somente o formulário final solicitado.
- Conferir a possibilidade de ajustar a marca dos e-mails existentes. Se depender de configurar domínio de envio ou nova infraestrutura, informar o passo necessário sem alterar o banco.
- Os links externos e a imagem no domínio oficial passam a valer no site publicado somente após Pedro publicar.

## Detalhes técnicos
- Centralizar URLs de orçamento e identificação dos locais; usar o botão existente para links externos.
- Centralizar consentimento, bloqueio por rota e eventos; iniciar Consent Mode v2 como denied, desativar pageview automático e enviar uma visualização por navegação consentida.
- GA4 `G-CE7GKKDG4L`, linker entre os dois domínios; Pixel `644216424824915` carregado somente com consentimento. Eventos de orçamento incluem `local`; uso de simulador disparado na primeira interação, sem dados pessoais.
- Bloquear também a telemetria de comportamento existente antes do consentimento para não manter coleta paralela sem autorização.
- Atualizar head por rota e pré-renderização com `https://radarbewild.com.br/og-radar.jpg`; remover URL r2.dev.
- Manter fontes em `fontesGuia` e rótulos de hipótese próximos às premissas, sem mudar fórmula nem controles.

## Verificação
- Testes de URLs por local, consentimento inicial/aceito/recusado, exclusão de rotas privadas e eventos sem duplicação.
- Testes atuais de dados e cálculos; lint e compilação/verificação de tipos automática da plataforma, sem executar build ou typecheck manual.
- Conferência em computador e celular: CTAs, banner, navegação e eventos consentidos.
- Renderizar a home pela entrada SSR e conferir ausência dos textos removidos, rodapé e metadados novos; relatório agrupado em texto sem número, fonte e premissa.