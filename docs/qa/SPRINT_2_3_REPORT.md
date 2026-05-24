# Sprint 2-3 QA Report

Data da revalidação: 2026-05-14

## Gate técnico

| Comando | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run smoke:roles` | PASS |
| `npm run test:rules` | PASS |
| `npm run smoke:setup:dry` | PASS |
| `npm run backfill:date-fields -- --dry-run` | PASS (`wouldUpdate: 0`, `invalid: 0`) |

## Evidência funcional

| Area | Implementado? | Validado em browser? | Evidencia | Status |
|---|---|---|---|---|
| Exercise Library | Sim | Sim | `qa/prescriptors-sprints/exercise-library-admin.png` | PASS |
| Workout Builder | Sim | Sim | `qa/prescriptors-sprints/workout-builder-rpe-rir-notes-fixed.png` | PASS |
| Workout Execution History | Sim | Sim | `qa/prescriptors-sprints/student-workout-after-fixed-assignment.png` | PASS |
| Admin Progression Panel | Sim | Sim | `qa/prescriptors-sprints/admin-student-progression-fixed.png` | PASS |
| Food Library | Sim | Sim | `qa/prescriptors-sprints/admin-food-library.png` | PASS |
| Diet Builder | Sim | Sim | `qa/prescriptors-sprints/admin-diet-timestamp-fixed.png` | PASS |
| Student Diet Flow | Sim | Sim | `qa/prescriptors-sprints/student-diet-after-fixed-assignment.png` | PASS |
| Student Workout Execution Premium | Sim | Sim | `qa/student-workout-execution-premium/student-workout-session-exercise-context.png` | PASS |
| Student Onboarding + Preferences | Sim | Sim | `qa/student-onboarding-preferences/student-onboarding-step-welcome.png` | PASS |

## Rodada de 14/05/2026

### Escopo corrigido/fortalecido

1. member ativo e incompleto agora cai em `/onboarding`.
2. member sem assinatura continua travado em `/app/billing/lock`, antes de qualquer onboarding.
3. o wizard de onboarding coleta sexo, peso, altura, objetivo, frequência, nível, local, preferência alimentar e meta de água.
4. o fluxo conclui em `/app/recommendations`, hoje com placeholder funcional e honesto.
5. `/app/profile` agora permite editar as preferências que alimentam recomendação futura.

### Confirmações funcionais

- aluno ativo incompleto abriu o onboarding corretamente;
- aluno bloqueado não atravessou para o onboarding;
- conclusão do onboarding persistiu flags e timestamps corretamente;
- edição de preferências marcou `recommendationsNeedRefresh: true`;
- admin, affiliate e mentor continuaram cobertos pelos redirecionamentos já validados em `smoke:roles`.

## Veredito

Student Onboarding + Preferences validado para QA interno controlado
