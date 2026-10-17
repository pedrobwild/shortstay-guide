# Validação de atualização de coletas — preparada, não executada

## Bloqueio atual

Em 17/10/2026, a listagem de ambientes retornou somente o projeto principal, sem drafts. A prévia e o site publicado compartilham a mesma base. Portanto, **não cadastrar coleta fictícia em `/admin/coletas`**, nem testar com gravação seguida de rollback/exclusão na produção.

Nenhuma coleta TESTE foi criada. A validação ponta a ponta do assistente Bewild permanece pendente; esse projeto só pode ser consultado por este chat.

## Condições para executar

- Confirmar um ambiente com banco, autenticação, funções e assistente isolados da produção **nos dois sites**. Uma cópia visual com a mesma conexão não é isolamento.
- Confirmar que o assistente de teste consulta exclusivamente essa base e que nenhum aviso de teste chega aos sites publicados.
- Usar duas coletas identificadas como **TESTE — dados fictícios, não usar para investimento**, sem copiar os números do levantamento aprovado. Definir os valores somente após confirmar o isolamento.
- Alternativa: aguardar dois levantamentos reais aprovados e validar no fluxo normal, sem inventar período ou indicadores.

## Roteiro aguardando isolamento ou dados reais

1. Registrar a coleta A pela tela administrativa do ambiente autorizado. Anotar bairro, fonte, período, data, diária, ocupação, amostra e quartis, se disponíveis.
2. Perguntar ao assistente desse ambiente “Quais as coletas de [bairro]?” e manter o histórico aberto. Confirmar A ativa e seus indicadores exatos.
3. Registrar a coleta B do mesmo bairro/fonte, com período diferente e indicadores diferentes, pela mesma tela. As datas devem respeitar as validações existentes.
4. Sem recarregar a página do assistente, conferir B **ativa** e A **substituída**, sem apagar A nem misturar os indicadores de A com os de B.
5. Conferir período, data da coleta, fonte, amostra, diária, ocupação e quartis de B contra o registro enviado; conferir os mesmos campos de A preservados no histórico.
6. Repetir a pergunta em uma conversa nova para separar atualização do histórico aberto da consulta de dados atuais.
7. Confirmar ausência de autor, horário de registro administrativo e UTMs na resposta pública. A data pública de coleta não é o horário da auditoria.
8. Registrar evidências das duas respostas e do histórico, sem credenciais ou auditoria privada. Se só a conversa nova atualizar, registrar falha da atualização automática; não considerar o teste completo.

## Critérios de aprovação

- B ativa e A substituída, ambos com seus períodos e indicadores correspondentes.
- Histórico aberto atualizado sem recarregar; nova conversa também lê B.
- Nenhuma gravação ou publicação de dados fictícios na produção.
- Nenhuma auditoria privada exposta no assistente.

## Verificações locais disponíveis

`bunx vitest run src/lib/__tests__/radarColetas.test.ts src/lib/__tests__/radarRealtime.test.tsx src/lib/__tests__/radarMonitoramento.test.ts`

Esses testes verificam validação, monitoramento e invalidação de cache com serviços simulados. **Não comprovam** registro de uma nova coleta, substituição transacional nem atualização do assistente Bewild. O roteiro acima permanece pendente até haver isolamento confirmado ou dados reais aprovados.