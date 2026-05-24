# Student Evolution Report V1

Data da validacao: 2026-05-15

## Veredito permitido

Student Evolution Report V1 validado para QA interno controlado

## Escopo desta PR

- fortalecer `/app/evolution` como relatório real do aluno;
- consolidar corpo, treino, dieta, água, check-ins, consistência e resumo automático;
- adicionar preview real no `/app/today`;
- expor a mesma leitura no `Admin Student 360`;
- manter tudo sob demanda, sem snapshot salvo e sem IA.

## Auditoria de dados usados

| Fonte | Path | Dados disponíveis | Uso no relatório |
|---|---|---|---|
| Body check-ins | `users/{uid}/bodyCheckins` | `date`, `weightKg`, `measurements`, `photoUrls`, campos legados opcionais de gordura | peso atual vs anterior, fotos recentes, status corporal |
| Daily check-ins | `users/{uid}/dailyCheckins` | `dateKey`, `mood`, `energy`, flags diárias | check-ins concluídos, humor, energia, consistência |
| Weekly check-ins | `users/{uid}/weeklyCheckins` | `weekKey`, `createdAt`, métricas semanais | check-ins quinzenais/semanais no período |
| Workout sessions | `users/{uid}/workoutSessions` | `startedAt`, `completedAt`, `status`, `logs`, `totalTonnageKg`, `prs` | sessões concluídas, volume total, highlights reais |
| Diet days | `users/{uid}/dietDays` | `dateKey`, `adherencePercent`, itens e refeições concluídas | dias logados, média de aderência, melhor dia |
| Hydration days | `users/{uid}/hydrationDays` | `dateKey`, `goalMl`, `totalMl` | média de hidratação em `%` e `ml` |
| Insight service | `src/services/studentInsightService.ts` | churn risk, aderência semanal, regras de alertas | apoio ao painel admin e alinhamento de linguagem operacional |

## Implementacao

Arquivos principais:

- `src/services/studentEvolutionReportService.ts`
- `src/screens/evolution/EvolutionScreen.tsx`
- `src/screens/today/TodayScreen.tsx`
- `src/services/adminStudentService.ts`
- `src/screens/admin/AdminUserDetailScreen.tsx`
- `src/utils/labels.ts`

### Service novo

- `getStudentEvolutionReport(uid, { periodDays })` suporta `15` e `30` dias;
- leitura direta em subcollections do aluno, com `limit()` e sem `collectionGroup`;
- retorno com `Timestamp`, sem `toISOString` operacional;
- sem `as any`;
- `empty state` honesto quando faltam dados.

## Lógica V1

### Período

- padrão: `15 dias`;
- alternância suportada: `15 dias` e `30 dias`;
- cálculo sob demanda, sem salvar snapshot nesta PR.

### Corpo

- peso atual, anterior e delta só aparecem quando existem registros reais;
- gordura corporal só aparece se existir campo real no check-in;
- fotos usam apenas `photoUrls` reais do check-in mais recente;
- com menos de 2 body check-ins, o relatório assume `Dados corporais iniciais`.

### Treino

- considera apenas `workoutSessions` com `status = completed`;
- `totalTonnage` usa `totalTonnageKg` ou soma de `loadKg * reps`;
- highlights saem de cargas e volumes realmente registrados;
- não há PR inventado nem comparação falsa.

### Dieta

- usa `adherencePercent` quando existir;
- fallback para `completedItemsCount / totalItemsCount`;
- expõe dias registrados, média de aderência e melhor dia real.

### Água

- média em `%` calculada por `totalMl / goalMl`;
- fallback de meta: `profile.waterGoalMl`, depois `peso * 35`, depois `2500`;
- expõe média em `ml` só quando há registros reais.

### Check-ins e consistência

- check-ins diários: `dailyCompleted / periodDays`;
- check-ins quinzenais/semanais: contagem no período por `createdAt`;
- score de consistência:
  - treino `30 pontos`
  - dieta `30 pontos`
  - água `20 pontos`
  - check-in `20 pontos`
- classificação:
  - `0-39`: Baixa
  - `40-69`: Média
  - `70-100`: Alta

## Resumo automático

- sem linguagem médica;
- sem promessa de ganho muscular;
- sem “perda de gordura” quando só existe peso;
- motivacional, mas preso aos dados reais do período.

## Browser QA

Usuários validados:

- `student@expertclub.test`
- `student2@expertclub.test`
- `admin@expertclub.test`

### Cenário A — aluno com dados

- abriu `/app/evolution`;
- viu relatório dos últimos `15 dias`;
- alternou para `30 dias`;
- visualizou resumo automático, consistência, treino, dieta, água e check-ins;
- abriu `/app/today` e viu o CTA `Ver relatório de evolução`;
- console sem erro.

### Cenário B — aluno com poucos dados

- abriu `/app/evolution`;
- recebeu mensagem honesta de dados iniciais e relatório parcial;
- sem números inventados de corpo ou fotos fake;
- console sem erro.

### Cenário C — admin

- abriu `/admin/users/:id?tab=evolucao`;
- viu resumo automático, score de consistência, risco de abandono e motivos em PT-BR;
- sem `permission-denied`;
- console sem erro.

## Evidências

- `qa/student-evolution-report/student-evolution-report-15d.png`
- `qa/student-evolution-report/student-evolution-report-30d.png`
- `qa/student-evolution-report/student-evolution-insufficient-data.png`
- `qa/student-evolution-report/student-today-evolution-preview.png`
- `qa/student-evolution-report/admin-student-evolution-report.png`

## Gates

| Comando | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run smoke:roles` | PASS |
| `npm run test:rules` | PASS |
| `npm run smoke:setup:dry` | PASS |
| `npm run backfill:date-fields -- --dry-run` | PASS (`wouldUpdate: 0`, `invalid: 0`) |

## Limitações

- ainda sem snapshot salvo de relatório;
- ainda sem gráfico complexo ou comparação corporal avançada;
- body check-ins do QA atual não têm base suficiente para comparação corporal completa;
- highlights dependem de logs reais de carga e reps;
- continua sem IA, sem chat e sem resposta manual obrigatória.

## Veredito

Student Evolution Report V1 validado para QA interno controlado
