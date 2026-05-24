# Student Workout Execution Premium Report

Data da rodada: 2026-05-14

## Veredito permitido

Student Workout Execution Premium validado para QA interno controlado

## Escopo validado

- `/app/workouts`
- `/app/workouts/:id`
- `/app/workouts/session/:id`
- `/admin/users/:id?tab=workout`

## Alterações entregues

1. A biblioteca de treinos do aluno passou a destacar o plano atual com objetivo, nível, dias por semana, última atualização e resumo real de progresso.
2. A tela de detalhe do treino passou a mostrar contexto pré-execução por exercício: vídeo, instruções, cues, erros comuns, RPE/RIR e nota do treinador.
3. A execução do treino passou a mostrar bloco de progressão por exercício com última execução, melhor marca, volume recente e placeholders da sessão anterior.
4. O registro de séries ganhou validação inline para carga e repetições, bloqueando campos vazios e valores inválidos sem `alert()` ou `confirm()`.
5. `workoutProgressionService` passou a retornar dados reais e seguros, com `totalTonnage` sempre numérico e sem `null`.
6. O painel de treino do Admin Student 360 passou a mostrar sessões concluídas, volume total, sequência ativa, maiores evoluções e últimas cargas registradas.
7. `workoutSessionService` passou a normalizar logs, recalcular tonelagem com segurança e persistir timestamps sem ISO string nova no fluxo da sessão.

## Como a progressão funciona agora

- `totalTonnage = soma(carga x reps)` de todas as séries válidas.
- Série inválida é ignorada se:
  - `reps` ausente ou `<= 0`
  - `loadKg` ausente
  - `loadKg < 0`
  - qualquer valor não numérico
- Exercício corporal com carga `0` segue aceito quando informado explicitamente.
- Sem histórico:
  - `latestLoad`, `bestLoad` e volume recente viram empty state honesto
  - `totalTonnage` continua `0`

## Gates técnicos

| Comando | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run smoke:roles` | PASS |
| `npm run test:rules` | PASS |
| `npm run smoke:setup:dry` | PASS |
| `npm run backfill:date-fields -- --dry-run` | PASS (`wouldUpdate: 0`, `invalid: 0`) |

## Browser QA

### Aluno

- `student@expertclub.test` em browser limpo: PASS
- `/app/workouts` mostrou plano atual com CTA funcional: PASS
- `/app/workouts/:id` mostrou exercícios, RPE/RIR, notas, vídeo e instruções: PASS
- `/app/workouts/session/:id` mostrou contexto do exercício e métricas de progressão: PASS
- registro real de série com `12 reps` e `40 kg`: PASS
- conclusão real de treino: PASS
- nova sessão mostrou placeholder e histórico da sessão anterior: PASS
- sem `null` visível na UI validada: PASS

### Admin

- `admin@expertclub.test` em browser limpo: PASS
- `/admin/users/2GI57LeVLcWtyFqPdhUBlVeDJ202?tab=workout` mostrou painel real de progressão: PASS
- sem mock de gráfico ou números fake na tela validada: PASS

## Evidências

- `qa/student-workout-execution-premium/student-workouts-current-plan.png`
- `qa/student-workout-execution-premium/student-workout-detail-exercises.png`
- `qa/student-workout-execution-premium/student-workout-session-exercise-context.png`
- `qa/student-workout-execution-premium/student-workout-session-progress-placeholders.png`
- `qa/student-workout-execution-premium/student-workout-session-video-instructions.png`
- `qa/student-workout-execution-premium/student-workout-session-completed.png`
- `qa/student-workout-execution-premium/admin-student-workout-progression-panel.png`

## Greps obrigatórios

- `alert(`: 0 ocorrência em `src/screens/workouts` e `src/services/workout*`
- `confirm(`: 0 ocorrência em `src/screens/workouts` e `src/services/workout*`
- `href="#"`: 0 ocorrência
- `console.log`: 0 ocorrência em `src/screens/workouts` e `src/services/workout*`
- `as any`: 0 ocorrência em `src/screens/workouts` e `src/services/workout*`
- `totalTonnage: null`: 0 ocorrência
- `toISOString`: 0 ocorrência em `src/screens/workouts` e `src/services/workout*`

## Pendências restantes

- Release externo continua bloqueado.
- Esta rodada não valida IA, periodização avançada, novo builder admin nem dieta.

## Veredito

Student Workout Execution Premium validado para QA interno controlado
