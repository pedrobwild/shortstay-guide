- [x] Substituir as dez afirmações aprovadas e exibir suas fontes.
- [x] Padronizar percentuais e decimais com Intl.NumberFormat pt-BR, preservando moeda e case Pinheiros.
- [x] Ocultar o selo Edit with Lovable no site publicado.
- [x] Inventariar outras afirmações percentuais/multiplicadores sem fonte, sem alterá-las.
- [x] Verificar testes, lint, build automático e entrada SSR da home; registrar no relatório que não há resultado isolado de tipos/build de produção. Não publicar.
- [x] Atualizar coleta GuestFavorites aprovada, espelho do chat e fontes por bairro sem alterar o banco ou o case.
- [x] Trocar colunas por metragem por quartis; retirar ajuste de metragem e marcar decoração como hipótese.
- [x] Testar dados e conferir Pinheiros, Liberdade e Mooca na home pré-renderizada, carregada e páginas de bairro. 154 testes passaram, lint sem erros e compilação automática OK; SSR conferido diretamente, sem executar build de produção manual. Site não publicado; chat atualizado no serviço compartilhado.
- [x] Padronizar números em todos os gráficos e identificar as três curvas mensais como sazonalidade ilustrativa, gerada por fatores fixos e não observada.
- [x] Recalcular a cascata e sensibilidades do exemplo de Pinheiros usando a base curada, preservando os outros cenários e o case.
- [x] Verificar 158 testes, lint sem erros (15 avisos antigos), compilação automática OK, HTML da home por SSR e gráfico com eixos e tooltip em português; sem executar build de produção manual ou publicar.
- [x] Trocar CTAs e seção final por orçamento externo, padronizar Bewild e autoavaliação, atualizar rodapé.
- [x] Implementar consentimento, GA4/Pixel e eventos públicos com bloqueio de áreas privadas.
- [x] Criar imagem social a partir do hero e atualizar metadados públicos/pré-render.
- [x] Revisar afirmações sem fonte e rotular premissas, sem alterar cálculos protegidos.
- [x] Reorientar abertura para consulta de dados: apresentar Bewild, fontes e caminhos de leitura; tirar orçamento da abertura e barra fixa. Navegação mercado/mapa conferida em 320, 414 e 1280px, sem transbordamento; 44 testes passaram, compilação automática OK. Prompt Claude v2 atualizado; sem publicar.
- [ ] Marca dos e-mails de cadastro: depende da configuração de domínio de envio; a verificação retornou nenhum domínio de e-mail ativo/configurado, sem alterar dados ou autenticação.
- [x] Testar fluxos consentidos/recusados, CTAs e HTML pré-renderizado; verificar compilação automática e relatar categorias de textos alterados. Não publicar.
- [x] Recalcular somente exemplos de reforma com o estudo de 188 contratos, preservando simuladores e case.

- [x] Reescrever afirmações restantes em tendências, critérios de reserva, reforma, precificação e metragem com fontes existentes; 173 testes passaram e detalhes da tendência conferidos no navegador. Dados e cálculos preservados; sem publicar.

- [x] Gerar OG 1200×630 com Pinheiros (R$ 300/62%), Bela Vista (R$ 237/64%) e Vila Mariana (R$ 226/60%) e fonte GuestFavorites; atualizar head e pré-render. Imagem e metadados conferidos no navegador; 173 testes passaram, build automático OK; sem publicar.
- [x] Publicar o site para que banner de cookies, consentimento e links de orçamento apareçam a visitantes reais; publicação solicitada em 13/10/2026 às 09:02 UTC para https://radarbewild.com.br (visibilidade pública, selo oculto). A verificação de segurança não exigiu resolução prévia e registrou 1 pendência crítica: policy permissiva de INSERT/SELECT em guide_leads (e warn equivalente em guide_events, raw_listings, bairro_airbnb_sp).


- [x] Base única de dados de mercado: tabelas radar_fontes/radar_observacoes e view radar_bairro_atual (confiança e idade calculadas), carga com a coleta de 13/10/2026, app e chat lendo do banco, bairrosCurados.ts só como reserva; registro da correção de leitura de guide_leads/guide_events. Conferido Pinheiros, Liberdade, Mooca e Brooklin; 185 testes e lint OK; sem publicar.
- [ ] Site bewild.com.br passar a ler radar_bairro_atual (depende do repositório do site).
- [ ] Separar rótulos de estimativa (tipo da fonte), amostra pequena (pública, baixa, n < 200) e dado desatualizado (pública, coleta > 240 dias) no app e chat; testar e conferir Mooca/Brooklin, sem alterar dados/view/confiança ou publicar.
- [x] Regra de confiança da view radar_bairro_atual endurecida: 'media' agora exige amostra >= 200 E coleta <= 240 dias (antes bastava um dos dois). Mooca (n=85) passou a 'baixa' e ganhou o selo "estimativa"; Liberdade segue 'media'; demais inalterados. 185 testes OK, preview conferido, aviso de amostra pequena mantido. Não publicado — Pedro publica em seguida.
