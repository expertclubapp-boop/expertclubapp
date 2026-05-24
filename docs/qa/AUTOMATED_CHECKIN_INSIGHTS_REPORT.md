# Automated Check-in Insights Report

Data da validacao: 2026-05-15

## Veredito permitido

Automated Check-in Insights V1 validado para QA interno controlado

## Escopo desta PR

- criar a primeira camada de insights automáticos com dados reais do aluno;
- consolidar aderência, consistência, risco de abandono, resumo do ciclo e feedback automático simples;
- expor o resumo em `/app/today`, `/app/evolution` e `Admin Student 360`;
- manter cálculo sob demanda, sem IA generativa, sem chat e sem resposta manual obrigatória.

## Auditoria de dados usados

| Fonte | Path | Dados disponíveis | Uso no insight |
|---|---|---|---|
| Daily check-in | `users/{uid}/dailyCheckins` | `dateKey`, `mood`, `energy`, `sleep`, flags diárias | aderência de check-ins, recência, risco de abandono |
| Evolution/body check-in | `users/{uid}/bodyCheckins` | `date`, `weightKg`, `measurements`, fotos, campos legados opcionais de gordura | peso atual vs anterior, composição quando houver dado real |
| Workout sessions | `users/{uid}/workoutSessions` | `startedAt`, `completedAt`, `status`, `logs`, `totalTonnageKg` | treinos concluídos, aderência de treino, volume total, highlights |
| Diet days | `users/{uid}/dietDays` | `dateKey`, `adherencePercent`, itens/refeições concluídas | dias logados e média de aderência alimentar |
| Hydration days | `users/{uid}/hydrationDays` | `dateKey`, `goalMl`, `totalMl` | média de hidratação no período |
| Perfil | `profiles/{uid}` | `trainingFrequency`, `selectedWorkoutId`, `selectedDietId`, `waterGoalMl`, `recommendationsNeedRefresh` | meta ajustada do período, churn e CTA |

## Implementacao

Arquivos principais:

- `src/services/studentInsightService.ts`
- `src/services/adminStudentService.ts`
- `src/screens/today/TodayScreen.tsx`
- `src/screens/evolution/EvolutionScreen.tsx`
- `src/screens/admin/AdminUserDetailScreen.tsx`
- `src/utils/labels.ts`

### Service novo

- `getStudentInsightSummary(uid)` calcula o resumo principal dos últimos 7 dias;
- `generateCycleInsight(uid, { days })` gera headline, highlights e alertas operacionais para 7, 15 ou 30 dias;
- `getChurnRisk(uid)` expõe a regra simples de risco de abandono;
- cálculo sob demanda, sem snapshot persistido nesta PR.

## Lógica V1

### Aderência

- treino: sessões concluídas no período / frequência semanal esperada ajustada ao período;
- dieta: média de `adherencePercent`; se faltar, cai para itens concluídos / itens totais;
- água: média de `totalMl / goalMl`, limitada a `100%`;
- check-in diário: check-ins no período / dias do período.

### Risco de abandono

Score simples:

- `+30` sem check-in diário por `3+` dias;
- `+25` sem treino por `5+` dias;
- `+20` dieta abaixo de `40%` no período;
- `+15` água média abaixo de `40%`;
- `+10` recomendações desatualizadas.

Classificação:

- `0-29`: Baixo
- `30-59`: Médio
- `60+`: Alto

Reasons ficam em PT-BR, por exemplo:

- `Sem check-in diário nos últimos 5 dias`
- `Aderência de dieta abaixo de 40%`
- `Hidratação abaixo da meta`

### Empty state honesto

- V1 só libera análise automática quando existe pelo menos `1 treino concluído` no período;
- sem isso, o aluno recebe `Dados insuficientes para análise`;
- isso evita resumir “evolução” com base fraca demais no modelo low ticket.

## Browser QA

Usuários validados:

- `student@expertclub.test`
- `student2@expertclub.test`
- `admin@expertclub.test`

### Cenário A — aluno com dados

- abriu `/app/today`;
- bloco `Resumo da sua semana` apareceu com feedback automático;
- números e CTA foram renderizados sem placeholders falsos;
- console sem erro.

### Cenário B — aluno com poucos dados

- abriu `/app/today`;
- feedback caiu para `Dados insuficientes para análise`;
- sem promessas de evolução ou diagnóstico;
- console sem erro.

### Cenário C — admin

- abriu `/admin/users/:id`;
- `Visão Geral` exibiu `Resumo automático`;
- aba `Evolução` mostrou `Risco de abandono`, score e reasons em PT-BR;
- sem `permission-denied`.

## Evidências

- `qa/automated-checkin-insights/student-today-insights-summary.png`
- `qa/automated-checkin-insights/student-today-insufficient-data.png`
- `qa/automated-checkin-insights/admin-student-insights-panel.png`
- `qa/automated-checkin-insights/admin-student-churn-risk.png`
- `qa/automated-checkin-insights/browser-console-errors.txt`

## Gates

| Comando | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run smoke:roles` | PASS |
| `npm run test:rules` | PASS |
| `npm run smoke:setup:dry` | PASS |
| `npm run backfill:date-fields -- --dry-run` | PASS (`wouldUpdate: 0`, `invalid: 0`) |

## Greps obrigatórios

Resultados desta rodada:

- `alert(`: nenhuma ocorrência em `src/screens` e `src/services`
- `confirm(`: nenhuma ocorrência em `src/screens` e `src/services`
- `href=\"#\"`: nenhuma ocorrência
- `console.log`: nenhuma ocorrência em `src/screens` e `src/services`
- `as any`: dívida legada continua em telas admin antigas fora do fluxo novo de insights
- `toISOString`: dívida legada continua em `AdminCatalogScreens`, fora do fluxo operacional novo de insights

## Limitações

- sem IA, sem chat, sem WhatsApp, sem push real;
- sem persistência de snapshot quinzenal nesta PR;
- sem diagnóstico médico;
- sem leitura corporal “precisa” quando o aluno não registrou dado real;
- highlights de performance dependem de carga e reps registrados.

## Addendum de 2026-05-15 — compartilhamento com Evolution Report

A mesma base operacional de insights agora também alimenta o relatório de evolução:

- `/app/evolution` passou a consumir `studentEvolutionReportService`;
- `/app/today` ganhou preview real de consistência em `15 dias` com CTA para o relatório;
- `Admin Student 360` reaproveita churn risk do insight service e combina isso com consistência e métricas do relatório de evolução.

## Veredito

Automated Check-in Insights V1 validado para QA interno controlado
