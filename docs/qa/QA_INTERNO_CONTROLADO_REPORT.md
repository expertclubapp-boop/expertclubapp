# QA Interno Controlado Report

Data da rodada: 2026-05-15

## Status desta frente

- Student Visual Legibility Hotfix validado para QA interno controlado
- Unsafe Data Integrity Sweep validado para QA interno controlado
- Automated Check-in Insights V1 validado para QA interno controlado
- Student Evolution Report V1 validado para QA interno controlado

## Resumo

- a frente de prescrição, recomendação e execução já estava íntegra;
- o dashboard low ticket e a legibilidade crítica do aluno continuam validados;
- a camada de insights automáticos agora transforma dados reais em resumo semanal, risco de abandono e feedback simples;
- o aluno agora também enxerga um relatório de evolução consolidado com consistência, treino, dieta, água e check-ins;
- a rodada atual fechou os writes reais que ainda podiam gravar datas operacionais como string no Firestore;
- `as any` perigoso em write path ficou zerado;
- o backfill dry-run continuou limpo;
- ainda existem dívidas legadas fora do miolo de write, mas não bloqueiam esta validação controlada;
- release externo continua bloqueado.

## Validações

| Comando | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run smoke:roles` | PASS |
| `npm run test:rules` | PASS |
| `npm run smoke:setup:dry` | PASS |
| `npm run backfill:date-fields -- --dry-run` | PASS (`wouldUpdate: 0`, `invalid: 0`) |

## Browser QA

- `/app/today` mostrou treino, dieta, água, check-in diário e aderência semanal: PASS
- `/app/workouts`, `/app/workouts/session/:id`, `/app/diets/today` e `/app/recommendations` ficaram legíveis e funcionais em mobile: PASS
- edição de preferências, marcação de dieta, registro de água e check-in diário seguiram sem regressão aparente: PASS
- `/admin/users/:id?tab=treino` abriu em contexto admin e manteve regressão controlada: PASS
- Student 360 dieta permaneceu coberto pela validação funcional anterior no mesmo ambiente: PASS
- `/app/today` mostrou `Resumo da sua semana` para aluno com dados reais: PASS
- `/app/today` mostrou `Dados insuficientes para análise` para aluno com poucos dados: PASS
- `/admin/users/:id?tab=evolution` mostrou `Risco de abandono` e reasons em PT-BR: PASS
- `/app/evolution` mostrou relatório de `15` e `30` dias com dados reais: PASS
- `/app/today` mostrou CTA `Ver relatório de evolução`: PASS
- `/admin/users/:id?tab=evolucao` abriu o painel de evolução sem erro: PASS

## Evidências

- `qa/low-ticket-dashboard/student-dashboard-main-390.png`
- `qa/low-ticket-dashboard/student-dashboard-main-430.png`
- `qa/low-ticket-dashboard/student-dashboard-main-1440-preview.png`
- `qa/low-ticket-dashboard/student-dashboard-water-updated.png`
- `qa/low-ticket-dashboard/student-dashboard-daily-checkin-pending.png`
- `qa/low-ticket-dashboard/student-dashboard-daily-checkin-completed.png`
- `qa/low-ticket-dashboard/student-dashboard-evolution-countdown.png`
- `qa/low-ticket-dashboard/student-dashboard-recommendations-refresh.png`
- `qa/low-ticket-dashboard/student-dashboard-no-plan-state.png`
- `qa/student-visual-legibility-hotfix/student-today-legibility-fixed-390.png`
- `qa/student-visual-legibility-hotfix/student-workouts-legibility-fixed-390.png`
- `qa/student-visual-legibility-hotfix/student-workout-session-legibility-fixed-390.png`
- `qa/student-visual-legibility-hotfix/student-diet-legibility-fixed-390.png`
- `qa/student-visual-legibility-hotfix/student-recommendations-legibility-fixed-390.png`
- `qa/automated-checkin-insights/student-today-insights-summary.png`
- `qa/automated-checkin-insights/student-today-insufficient-data.png`
- `qa/automated-checkin-insights/admin-student-insights-panel.png`
- `qa/automated-checkin-insights/admin-student-churn-risk.png`
- `qa/student-evolution-report/student-evolution-report-15d.png`
- `qa/student-evolution-report/student-evolution-report-30d.png`
- `qa/student-evolution-report/student-evolution-insufficient-data.png`
- `qa/student-evolution-report/student-today-evolution-preview.png`
- `qa/student-evolution-report/admin-student-evolution-report.png`
- `qa/legacy-debt-sweep/affiliate-public-page-no-dead-links.png`
- `qa/legacy-debt-sweep/admin-student-360-regression-check.png`

## Guardrails

- não houve deploy
- não houve backfill apply
- não houve seed destrutivo amplo
- release externo continua bloqueado

## Veredito

- Student Visual Legibility Hotfix validado para QA interno controlado
- Unsafe Data Integrity Sweep validado para QA interno controlado
- Automated Check-in Insights V1 validado para QA interno controlado
- Student Evolution Report V1 validado para QA interno controlado
