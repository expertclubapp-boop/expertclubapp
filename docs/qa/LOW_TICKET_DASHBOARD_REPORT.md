# Low Ticket Dashboard Report

Data da validacao: 2026-05-14

## Veredito permitido

Low Ticket Dashboard + Daily Engagement validado para QA interno controlado

## Escopo desta PR

- refatorar `/app/today` para virar o centro diario real do aluno;
- unificar treino, dieta, agua, check-in diario, check-in de evolucao e aderencia semanal;
- expor alertas simples e proximo passo com CTA real;
- manter o dashboard acessivel mesmo quando faltar plano ou houver refresh de recomendacoes;
- melhorar legibilidade de metricas importantes no mobile.

## Implementacao

Arquivos principais:

- `src/screens/today/TodayScreen.tsx`
- `src/services/studentDashboardService.ts`
- `src/router/utils.ts`
- `src/router/AppRoute.tsx`
- `scripts/roleRedirectSmoke.ts`

### Blocos funcionais entregues

1. Saudacao + status do dia
2. Proximo passo principal
3. Plano atual de treino
4. Plano atual de dieta
5. Hidratação com acoes rapidas `+250 ml` e `+500 ml`
6. Check-in diario com estado pendente ou concluido
7. Countdown do check-in quinzenal/evolucao
8. Aderencia semanal
9. Alertas simples
10. Atalhos rapidos

## Como o dashboard monta os dados

Service principal:

- `studentDashboardService.getStudentTodayDashboard(uid)`

Fontes reais usadas:

- `profiles/{uid}`
- `users/{uid}/workoutSessions`
- `users/{uid}/dietDays`
- `users/{uid}/hydrationDays`
- `users/{uid}/dailyCheckins`
- `users/{uid}/bodyCheckins`

Regras aplicadas:

- sem `collectionGroup` desnecessario;
- sem mock;
- `limit()` nas leituras historicas;
- empty state honesto quando faltar dado;
- `permission-denied` nao e mascarado;
- hidratacao, aderencia e contagem usam apenas registros reais.

## Logica de proximo passo

Prioridade validada:

1. `recommendationsNeedRefresh = true` -> atualizar planos
2. falta treino ou dieta -> escolher planos
3. check-in diario pendente -> fazer check-in
4. treino do dia nao concluido -> iniciar treino
5. dieta do dia incompleta -> registrar dieta
6. agua abaixo da meta -> registrar agua
7. check-in de evolucao vencido -> enviar evolucao
8. caso tudo esteja em dia -> ver evolucao

## Browser QA

Usuarios validados:

- `student2@expertclub.test`
- `student@expertclub.test`

### Cenario A - aluno com planos

- abriu `/app/today`;
- treino atual apareceu com CTA funcional;
- dieta do dia apareceu com calorias e refeicoes;
- bloco de agua apareceu com progresso e acoes rapidas;
- check-in diario apareceu como pendente;
- countdown de evolucao apareceu com data real;
- aderencia semanal apareceu sem numero mockado.

### Cenario B - aluno sem planos

- conta QA foi colocada temporariamente sem `selectedWorkoutId` e `selectedDietId`;
- `/app/today` permaneceu acessivel;
- dashboard mostrou `Escolher meus planos`, `Escolher treino` e `Escolher dieta`;
- nao houve loop de redirecionamento;
- apos a captura, o estado QA foi restaurado.

### Cenario C - recomendacoes desatualizadas

- `recommendationsNeedRefresh` foi ativado temporariamente;
- `/app/today` mostrou badge, alerta e CTA `Ver novos planos`;
- o dashboard nao expulsou o aluno da rota;
- apos a captura, o estado QA foi restaurado.

### Cenario D - agua

- clique em `+250 ml` atualizou a UI;
- recarga confirmou persistencia;
- console seguiu limpo.

### Cenario E - check-in diario

- CTA `Responder agora` abriu `/app/checkin/daily`;
- envio real do check-in concluiu o fluxo;
- ao voltar para `/app/today`, o estado mudou para `Check-in feito`.

## Evidencias

- `qa/low-ticket-dashboard/student-dashboard-main-390.png`
- `qa/low-ticket-dashboard/student-dashboard-main-430.png`
- `qa/low-ticket-dashboard/student-dashboard-main-1440-preview.png`
- `qa/low-ticket-dashboard/student-dashboard-water-updated.png`
- `qa/low-ticket-dashboard/student-dashboard-daily-checkin-pending.png`
- `qa/low-ticket-dashboard/student-dashboard-daily-checkin-completed.png`
- `qa/low-ticket-dashboard/student-dashboard-evolution-countdown.png`
- `qa/low-ticket-dashboard/student-dashboard-recommendations-refresh.png`
- `qa/low-ticket-dashboard/student-dashboard-no-plan-state.png`
- `qa/low-ticket-dashboard/browser-console-errors.txt`

## Gates

| Comando | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run smoke:roles` | PASS |
| `npm run test:rules` | PASS |
| `npm run smoke:setup:dry` | PASS |
| `npm run backfill:date-fields -- --dry-run` | PASS (`wouldUpdate: 0`, `invalid: 0`) |

## Greps obrigatorios

Resultado desta rodada:

- `alert(`: 2 ocorrencias em telas de affiliate fora do escopo desta PR
- `confirm(`: nenhuma ocorrencia em `src/screens` e `src/services`
- `href=\"#\"`: nenhuma ocorrencia
- `console.log`: nenhuma ocorrencia em `src/screens` e `src/services`
- `as any`: divida residual em areas legadas fora do dashboard
- `toISOString`: divida residual em fluxos antigos fora desta frente
- `text-[10px]`: ainda ha muitas ocorrencias em telas legadas; o dashboard novo evitou esse tamanho nas metricas principais

## Pendencias restantes

- refinar tipagem legada em check-ins e modulos admin antigos;
- reduzir `text-[10px]` em outras areas do app do aluno;
- expandir o dashboard com relatorio automatico de evolucao em PR futura.

## Addendum de 2026-05-14 — Student Visual Legibility Hotfix

Nesta rodada o dashboard e as rotas centrais do aluno receberam correção funcional de legibilidade, sem redesign global:

- títulos e labels principais ganharam contraste mais alto;
- badges e pills receberam padding e tipografia maiores;
- métricas críticas deixaram de usar `text-[10px]` e tons apagados;
- bottom nav e header do aluno ficaram mais consistentes com o tema dark.

Evidências adicionais:

- `qa/student-visual-legibility-hotfix/student-today-legibility-fixed-390.png`
- `qa/student-visual-legibility-hotfix/student-workouts-legibility-fixed-390.png`
- `qa/student-visual-legibility-hotfix/student-workout-session-legibility-fixed-390.png`
- `qa/student-visual-legibility-hotfix/student-diet-legibility-fixed-390.png`
- `qa/student-visual-legibility-hotfix/student-recommendations-legibility-fixed-390.png`

## Veredito

Low Ticket Dashboard + Daily Engagement validado para QA interno controlado

## Addendum de 2026-05-15 — Automated Check-in Insights V1

O dashboard `/app/today` agora também expõe uma primeira camada de retenção automática:

- `Resumo da sua semana` com treino, dieta, água e check-ins;
- feedback automático curto com CTA real;
- empty state honesto quando não há treino suficiente no período para sustentar análise;
- mesma base de cálculo compartilhada com `/app/evolution` e `Admin Student 360`.

Evidências adicionadas:

- `qa/automated-checkin-insights/student-today-insights-summary.png`
- `qa/automated-checkin-insights/student-today-insufficient-data.png`

Observação:

- esta camada continua low ticket e operacional;
- não houve introdução de IA, chat, diagnóstico ou fluxo manual obrigatório.

## Addendum de 2026-05-15 — Student Evolution Report V1

O dashboard `/app/today` agora também faz ponte direta com a camada de percepção de valor do aluno:

- preview `Relatório de evolução` com consistência real dos últimos `15 dias`;
- CTA funcional `Ver relatório de evolução`;
- leitura compartilhada com `/app/evolution` e `Admin Student 360`;
- sem poluir o dashboard com gráfico fake ou métrica inventada.

Evidência adicionada:

- `qa/student-evolution-report/student-today-evolution-preview.png`
