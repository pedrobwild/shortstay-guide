# Agendamento externo GuestFavorites

A função aceita POST protegido por `x-coleta-key` e responde 202 com o identificador da execução. A coleta continua em segundo plano; aprovação dos dados públicos permanece manual.

1. Em Lovable Cloud → Functions → coletar-guestfavorites, copie o endereço da função.
2. Crie um trabalho no cron-job.org com esse endereço e método POST.
3. Sugestão: uma vez por dia, às 06:00, America/Sao_Paulo. Isso limita o consumo recorrente; mudanças podem demorar até 24 horas para serem propostas.
4. Gere `GUESTFAVORITES_SCHEDULE_KEY` no formulário seguro do Lovable e copie o mesmo valor para o cabeçalho `x-coleta-key` do agendador. Nunca use senha pessoal ou chave administrativa.
5. Corpo `{}`, cabeçalho `Content-Type: application/json`. Sem tentativas imediatas.
6. Salve e habilite o trabalho; execute o teste e confira 202.
7. Confira origem externa, horário e resultado final em `/admin/coletas`. O 202 confirma aceitação, não conclusão.

Sem um trabalho habilitado no serviço externo, o agendamento não está ativo. O consumo do Lovable Cloud depende do plano; confira condições do serviço externo.

Execuções concorrentes retornam 409; a proteção expira em dez minutos. Cada página tem espera máxima de oito segundos. O painel consulta status a cada cinco segundos enquanto executa e a cada minuto quando ocioso, apenas enquanto aberto.

Fontes oficiais: https://docs.cron-job.org/creating-cron-jobs.html e https://cron-job.org/en/faq/