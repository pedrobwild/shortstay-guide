# Radar Bewild - Plano completo de melhorias

*Estratégia de conteúdo, produto e captação | 27 de outubro de 2026*

Transformar o Radar em uma referência para quem avalia, compra e prepara studios para locação em São Paulo, criando uma jornada mensurável até os serviços de reforma da Bewild.

> **Direção recomendada**
>
> Dados locais para entender o mercado, ferramentas para testar a decisão e casos reais para demonstrar a capacidade de execução da Bewild.

## O que já está construído

O projeto reúne consulta de bairros, mapa, comparação, simuladores, guias, fontes públicas, estudo de contratos de reforma e área exclusiva. A oportunidade é conectar esses ativos em uma jornada simples, com ofertas de captação adequadas a cada etapa. [R1-R6]

## O que muda primeiro

- **Captação:** oferecer um checklist ou estudo personalizado por e-mail, com poucos campos e sem exigir senha para receber o material.
- **Conversão:** criar uma passagem explícita para o orçamento quando o visitante informa que já tem imóvel e pretende reformar.
- **Autoridade:** tornar visíveis os limites das bases e publicar estudos próprios com método, autoria e atualização.
- **Medição:** acompanhar o caminho completo da origem ao contrato, distinguindo consulta, cadastro, pedido e oportunidade aceita pelo comercial.

## Como ler este plano

O plano reúne diagnóstico e experiência; captação e conteúdo; autoridade, relacionamento, SEO e métricas; execução e critérios de aceite; fontes e limites.

Escopo: proposta de melhorias. Foram consultados o código e fluxos públicos do site em desktop. Nenhuma alteração foi publicada, nenhum cadastro foi submetido e nenhuma campanha ou mensagem foi enviada. As estimativas de esforço e metas de teste são hipóteses de planejamento.

## As barreiras observadas

| Achado | Evidência e efeito | Tratamento recomendado |
| --- | --- | --- |
| CTA de orçamento suprimido | OrcamentoButton retorna null. No simulador, o bloco de reforma aparece sem esse botão. [R1] | Criar caminho contextual de orçamento e verificar destino, envio e atribuição. |
| Cadastro pede conta e senha | Nome, e-mail e senha são exigidos para criar acesso. Isso adiciona uma etapa à entrega de valor. [R2] | Separar recebimento de material e assinatura de conteúdo da criação de conta. |
| Estudo salvo parcialmente | O provisionamento envia bairro e faixa de área; outras premissas não entram nesse caminho. [R3] | Guardar a versão completa do cenário e as fontes usadas. |
| Telemetria depende da home | O registrador de trackGlobal é ligado na home e limpo na desmontagem. [R4] | Validar eventos em entradas diretas e navegação entre páginas. |
| Catálogo editorial pouco desenvolvido | Em /posts foram vistos dois artigos e uma ação de envio voltada ao autor. [R5] | Curadoria por tarefa, busca e próxima leitura; autoria no ambiente adequado. |
| HTML inicial limitado em algumas rotas | /posts e /projecao entregaram título, descrição e navegação na leitura sem execução do app. [R6] | Pré-renderizar conteúdo explicativo e catálogo útil nas entradas orgânicas. |
| Recorte dos dados pouco próximo do número | A fonte abrange vários tipos de anúncio; isso já é explicado na metodologia e no artigo de Pinheiros. [R7, W2] | Levar o aviso para hero, bairros, comparador e relatório. |
| Histórico de preço usado no planejamento | Estimativa de reforma parte do estudo; o artigo também distingue tabela vigente. [R8, W3] | Exibir histórico e referência atual em campos separados. |

A presença de uma barreira não quantifica sua perda de conversão. A telemetria interna foi avaliada estaticamente; não foi feito acesso ao banco ou ao painel para comprovar eventos perdidos. O GA4 tem implementação separada.

## Posicionamento e papel de cada site

> Decida a compra e a preparação do seu studio com dados de São Paulo.

Esse é o território editorial recomendado. Ele conecta dúvidas que surgem antes da contratação de uma reforma à competência que a Bewild consegue demonstrar com projetos, obras e custos documentados.

| Público | Tarefa do Radar | Próximo passo |
| --- | --- | --- |
| Ainda estuda investir | Entender custos, limitações e diferenças entre bairros. | Checklist, comparação salva e boletim por interesse. |
| Procura um imóvel | Conferir premissas, condomínio, preço, financiamento e preparação. | Dossiê de decisão e previsão de entrega de chaves. |
| Comprou ou receberá as chaves | Planejar escopo, investimento, prazo e fornecedores. | Checklist de preparação e pedido de orçamento. |
| Já opera o studio | Ler custos, manutenção e possíveis adequações. | Diagnóstico de melhorias; reforma somente quando fizer sentido. |

### Radar: ferramenta e informação local

Concentrar dados por bairro, comparação, simulação, metodologia e continuidade dos estudos. O retorno recorrente deve vir de utilidade: guardar uma decisão, retomar uma conta ou consultar uma atualização real.

### Bewild: análise editorial, casos e contratação

Manter artigos extensos, portfólio, páginas de serviço e orçamento no site principal. O repositório já documenta essa divisão. Conectar os dois domínios com links contextuais e contexto preservado; a proposta não exige migrar tudo para um domínio novo. [R5]

### Uma promessa verificável

Trabalhar para ser a referência nesse recorte de studios em São Paulo, apoiada em evidência e uso recorrente. Evitar autodeclarações como maior portal, ferramenta mais precisa ou retorno superior enquanto não houver comparação que as sustente.

## Home e navegação orientadas à decisão

### Hero sugerido

> Vai investir em um studio em São Paulo? Comece pela conta completa.

Compare dados de bairros, simule o resultado depois dos custos e planeje a reforma. Veja as fontes, ajuste as premissas e entenda o que ainda precisa confirmar antes de decidir.

| Elemento | Texto proposto |
| --- | --- |
| Ação principal | Simular receita e custos |
| Ação secundária | Comparar bairros de São Paulo |
| Continuidade de pesquisa | Receber o checklist de compra |
| Aviso junto aos dados | Referências de anúncios do bairro, de diferentes tipos de imóvel. Não representam a receita de um studio específico. |

### Ordem recomendada da página

Manter a consulta útil logo no início. Em seguida: escolher etapa da jornada; comparar bairros; entender custos; ver um caso documentado; receber material de apoio; consultar autoria e metodologia. A oferta de captação entra depois de uma primeira resposta, sem cobrir a tela na chegada.

### Navegação proposta

- **Bairros:** reúne mercado, mapa, ranking e comparação, hoje distribuídos em várias entradas.
- **Simular resultado:** descreve o benefício da projeção. Financiamento aparece dentro da jornada de compra.
- **Guias e análises:** substitui o rótulo genérico Posts, com filtro por tarefa e etapa.
- **Preparar a reforma:** dá acesso direto ao caminho de quem já tem imóvel. A ação de conta explica o benefício: salvar estudos.

Preservar endereços existentes e os cálculos compartilhados. Os textos são propostas para teste; não há evidência de aumento de conversão ainda. A interface atual já tem boa base de tipografia, dados e identificação de fontes.

## Ofertas de captação por intenção

O visitante deve conseguir consultar a resposta principal sem cadastro. O contato é solicitado quando existe uma entrega adicional clara: receber, guardar, acompanhar ou aplicar a informação ao próprio caso.

| Oferta | Onde oferecer | O que entregar |
| --- | --- | --- |
| Checklist antes de comprar | Guias de compra, bairros e comparador. | Lista de verificações de prédio, unidade, custo total e preparação; campos para anotar respostas. |
| Dossiê da simulação | Depois de gerar um cenário útil. | Premissas, fontes, custos, sensibilidades e itens a confirmar; versão por e-mail ou link privado. |
| Plano de preparação para as chaves | /reformar e guias de obra. | Escopo, decisões pendentes, documentos e cronograma de preparação para orçar. |
| Boletim Radar Bewild | Depois de consumir dados ou um guia. | Uma leitura útil por edição e atualizações de bairros quando houver mudança real na base. |

### Formulário inicial

**E-mail obrigatório.** Primeiro nome opcional. Etapa da jornada pode ser herdada do contexto ou perguntada depois da entrega. Não exigir WhatsApp, renda, valor do imóvel ou senha para receber um checklist. O pedido de orçamento pode ter os campos operacionais necessários.

### Texto de uma oferta

> **Antes de comprar o studio, confira o que pode mudar a conta.**
>
> Receba um checklist para avaliar o prédio, a unidade, os custos e a preparação para alugar.
>
> **Botão:** Receber meu checklist
>
> **Preferência separada:** Quero também receber as próximas análises do Radar Bewild.

Entregar o material solicitado mesmo quando a pessoa não assina o boletim. Explicar quem enviará, para qual finalidade e como cancelar as comunicações. Registrar a preferência por canal. A implementação e os avisos devem seguir a política de privacidade revisada da empresa.

Estas ofertas são propostas. Os materiais ainda precisam ser produzidos e validados antes de anunciar sua disponibilidade.

## O estudo personalizado como produto

A simulação já funciona sem conta e tem ações para copiar, compartilhar e salvar cenários. O pacote deve ampliar essa base: tornar a continuação mais clara e guardar exatamente a conta que a pessoa fez. [R3]

### Conteúdo mínimo do dossiê

- Bairro, finalidade, faixa de área e data do estudo; origem de cada dado e versão do cálculo.
- Diária e ocupação utilizadas, com distinção entre referência da fonte e valor alterado pelo usuário.
- Receita, despesas e resultado; investimento incluído, custos omitidos e efeito do financiamento quando aplicável.
- Três cenários editáveis e uma sensibilidade: o que muda ao reduzir diária, ocupação ou elevar custos. Cenários são hipóteses, sem rótulo de probabilidade estatística.
- Checklist do que falta confirmar e um próximo passo adequado à etapa: comparar outra opção, preparar a reforma ou solicitar orçamento.

### Jornada proposta

1. A pessoa consulta e ajusta a conta. 2. Recebe o resultado na tela. 3. Pode pedir uma cópia por e-mail. 4. Decide se quer guardar estudos em uma conta. 5. Pode solicitar contato sobre reforma, com manifestação específica desse interesse.

### Correção de continuidade

O caminho atual de criação do projeto transmite bairro e faixa de área. É necessário persistir as demais premissas antes de prometer guardar a simulação completa. O estudo deve reabrir com os mesmos valores e identificar separadamente qualquer recálculo com base nova. [R3]

### Ponte para o orçamento

> **Já tem o imóvel e quer planejar a reforma?**
>
> Envie as informações do studio para a Bewild avaliar o escopo e preparar o orçamento.
>
> **Botão:** Solicitar orçamento para este studio

Guardar os dados de forma privada. Não inserir nome, e-mail, telefone ou endereço pessoal em URLs públicas, eventos de marketing ou links de compartilhamento. Uma opção de acesso por e-mail pode ser avaliada tecnicamente sem liberar informações de conta sem autenticação.

## Conteúdo que aproxima a contratação

Usar as consultas do Search Console, as dúvidas do comercial e as tarefas do leitor para priorizar. A lista abaixo é uma proposta qualitativa: não foi medido volume de busca. Atualizar páginas equivalentes existentes antes de criar outra URL para a mesma intenção.

| Pauta ou atualização | Entrega útil | Oferta associada |
| --- | --- | --- |
| Quanto sobra de um studio no Airbnb? | Conta com custos e cenários editáveis. | Dossiê da simulação. |
| Quanto custa reformar um studio? | Histórico e tabela vigente, com escopo. | Plano de preparação. |
| O que conferir antes de comprar? | Checklist de prédio e unidade. | Checklist por e-mail. |
| Quanto o condomínio pesa na conta? | Sensibilidade em reais, com hipótese explícita. | Guardar a conta. |
| Short stay ou aluguel tradicional? | Comparação com o mesmo investimento e custos. | Comparação personalizada. |
| Financiar o studio fecha a conta? | Fluxo de caixa após prestação e custos. | Estudo salvo. |
| Quanto custa mobiliar e equipar? | Itens e inclusões para evitar dupla contagem. | Lista de preparação. |
| Quando começar a planejar a reforma? | Marcos antes e depois das chaves. | Planejamento das chaves. |
| Pinheiros e Moema: como comparar? | Mesma fonte, período e critérios. | Comparação salva. |
| Studios de 20, 25 e 30 m²: decisões reais | Plantas autorizadas, restrições e escopos. | Checklist do projeto. |
| O que não compensa mudar na reforma? | Critérios de manutenção e custo total. | Plano de escopo. |
| Caso documentado de um studio entregue | Decisões, investimento e resultados com período. | Conversa sobre reforma. |

Sequência de produção sugerida: revisar os dois artigos de maior conexão comercial; preparar quatro guias de decisão; criar duas análises locais; publicar casos conforme a documentação estiver disponível. A capacidade da equipe define a cadência, sem obrigação de publicar 12 textos novos.

## Padrão de UX writing para os guias

### Abertura proposta para um guia de compra

A diária do bairro ajuda a começar a análise. A decisão de comprar exige colocar na mesma conta o valor do imóvel, o condomínio, a preparação para alugar e os custos da operação. Um studio com receita maior pode deixar menos dinheiro disponível quando essas despesas são mais altas.

Antes de comparar duas unidades, registre o custo total de cada opção e teste o resultado com suas próprias premissas. Use os dados do bairro como referência inicial e confirme o que se aplica ao prédio e ao imóvel que você está avaliando.

### Estrutura de leitura

- **Resposta primeiro:** mostrar o critério ou a conta que resolve a dúvida logo no início.
- **Títulos informativos:** O que entra no investimento; Quanto sobra após os custos; O que conferir no condomínio; Quando pedir orçamento.
- **Profundidade:** explicar condição, efeito e consequência. Exemplo: uma despesa fixa continua existindo nos meses de menor ocupação; por isso, deve entrar na simulação em reais.
- **Próximo passo:** usar um CTA principal coerente com a tarefa. Evitar o mesmo pedido de orçamento em cada seção.

| Recurso | Função editorial | Regra de execução |
| --- | --- | --- |
| Tabela de custo total | Comparar alternativas equivalentes. | Mesmas unidades, data, escopo e exclusões. |
| Gráfico de sensibilidade | Mostrar o efeito de uma premissa. | Valores acessíveis também em texto ou tabela. |
| Planta e foto comentadas | Demonstrar uma decisão de projeto. | Distinguir render, obra e imagem ilustrativa. |
| Checklist | Ajudar a realizar uma verificação. | Itens acionáveis, com espaço para registrar a resposta. |

Autoria, revisão técnica pertinente, data de atualização substantiva e fontes próximas às afirmações. Em celular, tabelas precisam manter cabeçalhos e legibilidade. Sumário é indicado quando há várias tarefas independentes; não é obrigatório em todo texto.

## O que pode tornar o Radar uma referência

### 1. Observatório Bewild de preparação de studios

Produzir uma série periódica com custos contratados, escopos, metragens e prazos. Mostrar distribuições e diferenças de escopo, preservando dados pessoais. O estudo de 188 contratos já publicado é um ponto de partida; não equivale a uma auditoria independente do mercado inteiro. [W3]

### 2. Biblioteca de decisões e casos reais

Organizar casos por área, condição inicial e objetivo. Incluir planta, escolhas de material, limitações, investimento com data e o que foi entregue. Dados de operação exigem autorização, período e origem; um mês de ocupação não representa média anual. A comparação antes/depois precisa contextualizar sazonalidade e outras mudanças.

### 3. Estudos por bairro com interpretação local

Começar com quatro páginas piloto em bairros já cobertos. Acrescentar informações verificáveis sobre acesso, tipo de demanda e restrições da análise. Evitar gerar dezenas de páginas que apenas trocam o nome do bairro. Comparar receita e investimento separadamente: receita alta não demonstra maior rentabilidade.

### Ajustes de confiança prioritários

- Exibir junto aos indicadores que a fonte reúne diferentes tipos de anúncio. Só chamar uma base de específica para studios quando houver filtro documentado. [R7, W2]
- Separar período dos dados, data de coleta e revisão da fonte. Anúncios ativos indicam cobertura; não comprovam, sozinhos, a amostra usada no cálculo de todas as métricas.
- Manter aproximações de Brooklin e Vila Olímpia claramente identificadas. O padrão atual de sinalização deve permanecer. [R7]
- Separar preços históricos de contratos da referência comercial vigente. Validar garantias, escopo e condições antes de transformá-los em promessa de venda. [R8]
- Revisar a FAQ jurídica e tributária com profissionais responsáveis. O resumo atual faz recomendações gerais sobre CNPJ e enquadramento; o texto precisa refletir os casos aplicáveis, com fonte e data.

O comparativo da marca versus execução própria já é rotulado como hipótese. Recomenda-se separar esse argumento comercial da análise de mercado e substituí-lo progressivamente por evidência documentada, sem atribuir causalidade apenas à reforma. [R9]

## Relacionamento e passagem para vendas

### Cadência sugerida após uma solicitação

| Momento proposto | Conteúdo | Condição |
| --- | --- | --- |
| Na solicitação | Entrega do material, fonte e link para retomar a tarefa. | Sempre que a pessoa pedir o material. |
| Após 2 dias | Uma explicação de custo ou erro comum da mesma tarefa. | Somente com preferência válida para relacionamento. |
| Após 5 dias | Caso ou exemplo documentado pertinente ao interesse. | Mesmo recorte de bairro, metragem ou etapa. |
| Após 9 dias | Pergunta opcional sobre etapa e previsão de chaves. | Permitir responder sem formulário extenso. |
| Após 14 dias | Convite para planejar a reforma ou seguir estudando. | Oferta comercial adequada à resposta, sem insistência. |

### Qualificação em três dimensões

**Adequação:** local atendido, tipo de imóvel e escopo compatível. **Intenção:** pedido explícito de orçamento, planejamento de reforma ou interesse informado. **Prazo:** situação das chaves e janela desejada. O score comportamental existente pode apoiar a priorização, mas simular ou rolar a página não comprova disposição de contratar. [R10]

### Definições para marketing e comercial

- **Lead:** contato válido que solicitou uma entrega ou contato. Conta criada e assinatura de boletim ficam em categorias distintas.
- **Lead qualificado:** necessidade e adequação confirmadas pelos critérios definidos pela Bewild. O prazo é registrado, sem exclusão automática do investidor futuro.
- **Oportunidade aceita:** o comercial validou a demanda e existe um próximo passo acordado, como reunião ou coleta de informações para orçamento.

O CRM deve receber material solicitado, interesse, bairro quando informado, etapa, preferências de comunicação, origem e responsável. Deduplicar contatos e registrar motivo de perda ou desqualificação. A integração deve confirmar o recebimento e permitir recuperar falhas de entrega.

Proposta de operação: responder aos pedidos explícitos no mesmo dia útil, conforme capacidade definida pelo time. Cadastro para um material não autoriza uma sequência comercial em todos os canais. Nenhum envio ou automação foi criado neste trabalho.

## SEO, dados e experiência no celular

O projeto já tem metadados por rota, sitemap, pré-renderização e marcação estruturada. A melhoria é garantir que as páginas prioritárias entreguem conteúdo útil, consistente e acessível desde o HTML inicial. [R6]

### SEO e descoberta

- Dar a cada intenção uma página principal: dados locais no Radar; análise e serviço na Bewild. Evitar cópias integrais concorrentes e explicitar o benefício da área exclusiva quando temas também têm versões públicas. [R5]
- Ampliar o HTML inicial do catálogo e das ferramentas com explicação, exemplo, limites e links úteis. A interação continua no aplicativo. Confirmar a versão recebida pelo Google no Search Console.
- Manter canonical, status HTTP, sitemap e dados estruturados coerentes com o conteúdo visível. Dados privados exigem autenticação efetiva e tratamento de indexação adequado; robots.txt não é controle de acesso.
- Vincular autor, revisor, metodologia e fontes verificáveis. Revisar a licença de redistribuição dos dados de terceiros antes de atribuir uma licença aberta ao conjunto publicado. [R7]

### Busca com IA

Priorizar respostas claras, fontes, dados próprios e conteúdo textual acessível. A documentação oficial do Google não exige arquivo especial de IA nem schema exclusivo para essas experiências, e não garante inclusão. O llms.txt já existente pode ser mantido sem ocupar o centro do plano. [W4]

### Critérios de aceite em celular

- Validar larguras de 320, 360 e 390 px: leitura, seletores, teclado, formulários, gráficos e tabelas.
- Uma ação primária por etapa; banner de cookies, assistente e barra fixa sem sobreposição dos controles.
- Tabelas com cabeçalhos e rolagem compreensível; gráficos com descrição e dados equivalentes disponíveis em texto.
- Carregar mapa e recursos pesados quando necessários; medir Core Web Vitals e falhas por rota e aparelho, sem atribuir nota de desempenho sem medição.

A auditoria visual desta entrega foi feita em desktop. O checklist de celular e a validação de desempenho são trabalho de implementação ainda a executar.

## Métricas e testes que orientam a decisão

| Etapa | Métrica e denominador | O que significa |
| --- | --- | --- |
| Descoberta | Cliques orgânicos por página e consulta; separar marca e sem marca. | Encontrar novos leitores com intenção compatível. |
| Uso útil | Simulações concluídas / sessões da ferramenta. | Pessoa gerou um resultado válido, não apenas abriu a página. |
| Captação | Contatos novos válidos / sessões elegíveis na oferta. | Entrega solicitada e registrada, com deduplicação. |
| Qualificação | Leads qualificados / leads avaliados da mesma coorte. | Adequação e necessidade confirmadas. |
| Venda | Contratos / oportunidades aceitas da mesma coorte. | Evolução comercial, com janela de maturação definida. |
| Valor | Margem dos contratos atribuídos e custo por oportunidade. | Eficiência econômica após mídia, produção e operação. |

### Instrumentação mínima

Distinguir oferta vista, clique, solicitação aceita pelo servidor, material entregue, pedido de orçamento, oportunidade aceita e contrato. Os eventos de conteúdo e simulação devem funcionar quando a pessoa entra direto em /bairro, /guia ou /projecao. O GA4 já contém configuração entre domínios; verificar a continuidade real e conciliar com o CRM. [R4]

Registrar origem e contexto sem enviar contatos pessoais a ferramentas de marketing. Respeitar as escolhas de medição; mostrar a cobertura da medição consentida nos relatórios, sem tratar os usuários observáveis como todo o público.

### Dois testes iniciais

- **Oferta:** dossiê da simulação versus convite genérico de cadastro. Medir contatos válidos e avanço posterior, junto de erros e cancelamentos.
- **Contexto:** formulário que preserva bairro e etapa versus formulário genérico. Medir envio concluído e avaliação comercial, com o mesmo recorte de tráfego.

> **Cenário aritmético ilustrativo, sem previsão:**
>
> 10.000 sessões × 3% de captação = 300 leads.
>
> 300 × 20% qualificados = 60; 60 × 40% em reunião = 24; 24 × 25% em contrato = 6.
>
> As taxas são hipóteses para modelar o funil. Substituir por dados reais de coortes comparáveis.

Definir metas após uma linha de base com instrumentação validada. Em baixo tráfego, usar testes de tarefa e análise de coortes; não declarar vencedor de A/B com amostra insuficiente ou apenas um resultado inicial favorável.

## Plano de execução em 90 dias

| Período | Entrega | Responsável e dependência |
| --- | --- | --- |
| Dias 1-15 | CTA contextual, auditoria de eventos, recortes de dados, referência de preço e preservação da simulação. | Desenvolvimento + produto; validação de escopo, valores e privacidade. |
| Dias 16-30 | Checklist de compra, dossiê inicial, captura simples, confirmação de entrega e encaminhamento ao CRM. | Conteúdo + desenvolvimento + comercial; material final e provedor de envio definidos. |
| Dias 31-60 | Guias prioritários, quatro pilotos locais, home e catálogo revisados, relacionamento segmentado. | Conteúdo + design + especialistas; dados e casos disponíveis. |
| Dias 61-90 | Primeiro boletim/estudo, distribuição, testes de oferta e análise das primeiras coortes. | Conteúdo + parcerias + comercial; instrumentação e cadência em operação. |

### Distribuição que acompanha o conteúdo

Para cada estudo principal, produzir um vídeo curto com a decisão, um carrossel com a comparação e um resumo que leve à ferramenta correspondente. Criar páginas e materiais para corretores e incorporadoras encaminharem seus clientes, com origem identificada. Relacionamento com imprensa e parceiros depende de dados publicáveis e narrativa verificável, sem compra de links.

### Capacidade e esforço

Planejamento sugerido: responsável de produto/comercial, um desenvolvedor, apoio de design e produção editorial com revisão técnica. Como ordem de grandeza interna, correções pontuais podem ocupar 1-3 dias de desenvolvimento por item; captura com CRM e estudos completos pode exigir 1-2 sprints. Não é orçamento nem compromisso de prazo; estimar após definir os serviços de envio e o destino comercial.

### Critério para ampliar aquisição

Ampliar mídia ou produção quando entrega do material, encaminhamento comercial e atribuição estiverem funcionando. Se houver pouca adesão, observar a tarefa e a oferta; se houver muitos contatos fora do perfil, rever a distribuição e a qualificação. O objetivo operacional é gerar oportunidades que a Bewild consegue atender.

O calendário começa após priorização e disponibilidade da equipe. Não representa implantação realizada. Pedidos explícitos de contato recebem prioridade comercial; pesquisadores continuam na trilha de conteúdo apropriada.

## Backlog prioritário de implementação

| Item | Critério de aceite | Dono proposto |
| --- | --- | --- |
| P0.1 - Próximo passo comercial | CTA aparece no cenário de reforma, preserva contexto útil e chega a um formulário real; envio gera confirmação e registro único. | Produto + dev + comercial |
| P0.2 - Captura leve | Material solicitado com e-mail; senha e WhatsApp não são pré-requisitos; boletim opcional separado; estados de sucesso e erro claros. | Produto + conteúdo + dev |
| P0.3 - Estudo preservado | Editar diária, custos e reforma; salvar; sair; retornar. Premissas e fontes reabrem iguais, inclusive após confirmação de e-mail. | Dev |
| P0.4 - Telemetria em todas as entradas | Validar entrada direta e navegação home > bairro > projeção > orçamento; consentimento respeitado; clique não é contado como lead. | Dev + analytics |
| P0.5 - Contexto dos dados | Universo do anúncio, período, fonte e aproximações visíveis; cobertura de anúncios não é apresentada como garantia de precisão. | Dados + conteúdo |
| P0.6 - Custos e promessas | Histórico separado da referência atual; escopo de reforma, garantias e prazos revisados; nenhuma inferência de resultado garantido. | Comercial + técnico |
| P0.7 - Entrega ao comercial | Contato deduplicado, responsável, origem, interesse e preferências registrados; falhas de integração recuperáveis; status comercial retorna. | CRM + comercial |

### Onde a equipe encontra a base no código

R1: OrcamentoButton.tsx. R2: Signup.tsx. R3: AcoesSimulacao.tsx e leadProvisioning.ts. R4: Index.tsx, useGuideAnalytics.ts e marketingConsent.ts. R5: Posts.tsx e artigosBewild.ts. R6: entry-server.tsx e scripts/prerender.mjs. R7: Metodologia.tsx e dadosAbertos.ts. R8: provasBewild.ts e estudoFerramentas.ts. Links permanentes na seção de fontes.

## Backlog de conteúdo e autoridade

| Prioridade | Entrega e aceite | Dependência |
| --- | --- | --- |
| P1 - Home e catálogo | Navegação por tarefa; ações descritivas; catálogo sem comando de autoria para leitores; teste de localizar guia, comparar e retomar estudo. | Captação P0 e curadoria. |
| P1 - Seis guias principais | Resposta inicial concreta, escopo, exemplos e uma oferta pertinente; atualizar URLs equivalentes e conferir links. | Pesquisa editorial e revisão. |
| P1 - Quatro páginas locais piloto | Conteúdo próprio por bairro, referência comparável, aviso do universo e continuidade para ferramenta; sem copiar todo o artigo da Bewild. | Dados atuais e fontes locais. |
| P1 - Casos de reforma | Obra e material autorizados, planta, escopo e investimento com data; distinguir render e foto; resultado de locação só com fonte e período. | Documentação de clientes. |
| P1 - Relacionamento | Entrega solicitada separada de comunicações opcionais; trilhas por etapa; descadastro e preferência de canal verificados. | CRM e material final. |
| P1 - HTML e celular | Entradas principais úteis sem execução do app; cadastro, gráficos e tabelas legíveis em telas estreitas; teclado e foco conferidos. | Dev + design. |
| P2 - Publicação periódica | Primeiro estudo com método reproduzível, limites e histórico; dados publicáveis e licença verificada. | Qualidade e direito de uso. |
| P2 - Distribuição com parceiros | Kit com guia, ferramenta e origem de encaminhamento; medir qualidade das oportunidades por parceria. | Casos e funil em operação. |

### Decisão de prioridade

Começar pelo conjunto CTA contextual + captura simples + entrega útil + CRM + medição. Esse conjunto permite observar demanda e qualidade comercial. Guias, estudos e distribuição ganham um destino mensurável a partir dessa base.

Não é necessário construir novos mapas, simuladores ou painéis gerais para executar o pacote inicial. As recomendações aproveitam os recursos já presentes no repositório.

## Fontes, método e limites da auditoria

Consulta: 27/10/2026. Repositório pedrobwild/shortstay-guide, branch main, snapshot 03f8e98d78f2cdd708546e37547df28a827c7ada. Caminhos do código abaixo estão fixados nesse snapshot.

[R1: CTA de orçamento](https://github.com/pedrobwild/shortstay-guide/blob/03f8e98d78f2cdd708546e37547df28a827c7ada/src/components/OrcamentoButton.tsx) | [R2: Cadastro](https://github.com/pedrobwild/shortstay-guide/blob/03f8e98d78f2cdd708546e37547df28a827c7ada/src/pages/Signup.tsx) | [R3a: Ações da simulação](https://github.com/pedrobwild/shortstay-guide/blob/03f8e98d78f2cdd708546e37547df28a827c7ada/src/components/projecao/AcoesSimulacao.tsx) | [R3b: Provisionamento de projeto](https://github.com/pedrobwild/shortstay-guide/blob/03f8e98d78f2cdd708546e37547df28a827c7ada/src/lib/leadProvisioning.ts) | [R4a: Medição na home](https://github.com/pedrobwild/shortstay-guide/blob/03f8e98d78f2cdd708546e37547df28a827c7ada/src/pages/Index.tsx) | [R4b: Eventos internos](https://github.com/pedrobwild/shortstay-guide/blob/03f8e98d78f2cdd708546e37547df28a827c7ada/src/hooks/useGuideAnalytics.ts) | [R4c: Consentimento e analytics](https://github.com/pedrobwild/shortstay-guide/blob/03f8e98d78f2cdd708546e37547df28a827c7ada/src/lib/marketingConsent.ts) | [R5a: Catálogo editorial](https://github.com/pedrobwild/shortstay-guide/blob/03f8e98d78f2cdd708546e37547df28a827c7ada/src/pages/Posts.tsx) | [R5b: Papel editorial dos domínios](https://github.com/pedrobwild/shortstay-guide/blob/03f8e98d78f2cdd708546e37547df28a827c7ada/src/data/artigosBewild.ts) | [R6: Pré-renderização](https://github.com/pedrobwild/shortstay-guide/blob/03f8e98d78f2cdd708546e37547df28a827c7ada/scripts/prerender.mjs) | [R7: Metodologia e cobertura](https://github.com/pedrobwild/shortstay-guide/blob/03f8e98d78f2cdd708546e37547df28a827c7ada/src/pages/Metodologia.tsx) | [R8: Números de reforma](https://github.com/pedrobwild/shortstay-guide/blob/03f8e98d78f2cdd708546e37547df28a827c7ada/src/data/provasBewild.ts) | [R9: Comparativo ilustrativo](https://github.com/pedrobwild/shortstay-guide/blob/03f8e98d78f2cdd708546e37547df28a827c7ada/src/components/ota/BwildVsDiySection.tsx) | [R10: Score existente](https://github.com/pedrobwild/shortstay-guide/blob/03f8e98d78f2cdd708546e37547df28a827c7ada/src/lib/leadScore.ts)

[W1: Home e ferramentas do Radar](https://radarbewild.com.br/)

[W2: Artigo de Pinheiros: recorte da fonte](https://bewild.com.br/conteudos/studio-airbnb-pinheiros-quanto-rende)

[W3: Estudo de reforma e referência vigente](https://bewild.com.br/conteudos/quanto-custa-reformar-apartamento-studio-ate-50-m2)

[W4: Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)

[W5: Google: conteúdo útil](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

[W6: AirDNA: Rentalizer](https://help.airdna.co/en/articles/10559022-rentalizer-revenue-calculator)

[W7: QuintoAndar: guias](https://www.quintoandar.com.br/guias/)

[W8: Airbnb: comodidades para hóspedes](https://www.airbnb.com.br/resources/hosting-homes/a/the-amenities-guests-want-25)

### Benchmark qualitativo

AirDNA: tarefa de estimar com comparáveis e explicação da projeção. QuintoAndar: navegação editorial por tarefas imobiliárias e cidades. Airbnb: orientação prática conectada à ação do anfitrião. A adaptação proposta é combinar utilidade, recorte local e continuidade para preparação do imóvel. Não foi feito ranking de tráfego ou prova de conversão dessas referências. [W6-W8]

### O que foi e o que ainda precisa ser validado

Foram lidos arquivos do repositório e conferidos fluxos públicos em desktop: home, projeção, passagem para cadastro e catálogo. Não houve acesso a contas privadas, Search Console, analytics, CRM ou dados comerciais. Não foi submetido cadastro, testado envio real de material ou comprovado rendimento de imóveis. O estudo de contratos foi considerado como publicação da Bewild, sem auditoria dos registros originais. As recomendações de conversão são hipóteses; efeitos, esforço e cadência dependem de implementação e medição.
