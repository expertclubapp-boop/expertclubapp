# Sprint 1 QA Report

Data da revalidacao: 2026-05-13

## Escopo auditado

- Exercise Library
- Workout Builder
- Prescricao de treino no Admin Student 360
- Execucao do treino pelo aluno
- Painel de progressao na aba Treino

## Gate tecnico

| Comando | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run smoke:roles` | PASS |
| `npm run test:rules` | PASS |
| `npm run smoke:setup:dry` | PASS |
| `npm run backfill:date-fields -- --dry-run` | PASS (`wouldUpdate: 0`, `invalid: 0`) |

## Evidencia funcional

| Area | Implementado? | Validado em browser? | Evidencia | Status |
|---|---|---|---|---|
| Exercise Library | Sim | Sim | `qa/prescriptors-sprints/exercise-library-admin.png` | PASS |
| Workout Builder | Sim | Sim | `qa/prescriptors-sprints/workout-builder-rpe-rir-notes-fixed.png` | PASS |
| Workout Execution History | Sim | Sim | `qa/prescriptors-sprints/student-workout-after-fixed-assignment.png` | PASS |
| Admin Progression Panel | Sim | Sim | `qa/prescriptors-sprints/admin-student-progression-fixed.png` | PASS |
| Food Library | Fora do escopo principal da sprint 1 | Sim | `qa/prescriptors-sprints/admin-food-library.png` | INFO |
| Diet Builder | Fora do escopo principal da sprint 1 | Sim | `qa/prescriptors-sprints/admin-diet-timestamp-fixed.png` | INFO |
| Student Diet Flow | Fora do escopo principal da sprint 1 | Sim | `qa/prescriptors-sprints/student-diet-after-fixed-assignment.png` | INFO |

## Bugs encontrados em 13/05/2026

1. Workout Builder operacional nao expunha `RPE`, `RIR` nem notas por exercicio.
2. A atribuicao de treino atualizava a tela, mas nao consolidava `selectedWorkoutId` nem historico confiavel de prescricao.
3. O painel de progressao nao aparecia no Student 360.
4. Sessoes recentes podiam manter `totalTonnage` como `null`.

## Correcoes aplicadas

1. O editor operacional de treino passou a expor `RPE`, `RIR` e notas por exercicio, com persistencia e recarga corretas.
2. A atribuicao de treino passou a atualizar `users/{uid}/profiles.selectedWorkoutId`, registrar assignment ativo e expor historico funcional apos recarga do Student 360.
3. O aluno passou a abrir o treino atribuido atual e a ver placeholders de carga e reps anteriores na sessao seguinte.
4. O servico de progressao passou a calcular `totalTonnage` com fallback seguro para `0`, a partir de sessoes reais, sem depender de valor nulo persistido.
5. A aba Treino do Student 360 voltou a exibir o painel de progresso com empty state honesto ou metricas reais.

## Confirmacoes funcionais

- Admin criou treino real com `RPE 8`, `RIR 2` e nota por exercicio, salvou, recarregou e confirmou persistencia.
- `selectedWorkoutId` do aluno foi confirmado no Firestore com o treino novo.
- O Student 360 passou a mostrar treino atual, motivo, data e historico de prescricao.
- O aluno abriu o treino atribuido, iniciou sessao, registrou serie real e concluiu treino.
- Na sessao seguinte, placeholders anteriores apareceram como historico funcional.
- O painel de progressao mostrou sessoes reais e tonnage agregado sem `null`.

## Veredito

Prescriptor Flow Integrity validado para QA interno controlado
