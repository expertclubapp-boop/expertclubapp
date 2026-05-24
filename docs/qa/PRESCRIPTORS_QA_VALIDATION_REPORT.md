# Prescriptors QA Validation Report

Data da rodada: 2026-05-14

## Veredito permitido

Template Metadata + Recommendation Engine V1 validado para QA interno controlado

## Estado consolidado desta frente

Continuam válidos:

- Role Model + Navigation + Logout P0
- Admin Student 360º
- Admin Check-ins Review Flow
- Admin Prescription Operations
- Prescriptor Flow Integrity
- Prescription Assignments Read Path no ambiente remoto
- Student Workout Execution Premium

Nova validação desta rodada:

- Template Metadata + Recommendation Engine V1

## O que foi validado agora

| Área | Resultado | Evidência |
|---|---|---|
| metadata de treino editável no editor admin real | PASS | `qa/student-recommendations/admin-template-metadata-workout.png` |
| metadata de dieta editável no editor admin real | PASS | `qa/student-recommendations/admin-template-metadata-diet.png` |
| member sem plano cai em recommendations | PASS | `qa/student-recommendations/onboarding-completed-to-recommendations.png` |
| loading de recomendação | PASS | `qa/student-recommendations/recommendations-loading.png` |
| cards de treino com motivos explicáveis | PASS | `qa/student-recommendations/recommendations-workout-cards.png` |
| cards de dieta com motivos explicáveis | PASS | `qa/student-recommendations/recommendations-diet-cards.png` |
| escolha de treino e dieta pelo aluno | PASS | `qa/student-recommendations/recommendations-selection-confirmed.png` |
| `/app/today` refletiu a escolha | PASS | `qa/student-recommendations/today-after-plan-selection.png` |
| edição no perfil marcou refresh e CTA | PASS | `qa/student-recommendations/profile-refresh-recommendations.png` |

## Gates

| Comando | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run smoke:roles` | PASS |
| `npm run test:rules` | PASS |
| `npm run smoke:setup:dry` | PASS |
| `npm run backfill:date-fields -- --dry-run` | PASS (`wouldUpdate: 0`, `invalid: 0`) |

## Observações técnicas

- o fluxo legado de `/onboarding/goal`, `/onboarding/profile` e `/onboarding/preferences` foi retirado do caminho principal;
- templates agora carregam metadata de recomendação para treino e dieta;
- a engine V1 cruza objetivo, frequência, nível, sexo, local, preferência e faixa calórica;
- o aluno agora escolhe treino e dieta na própria `/app/recommendations`;
- a seleção atualiza `selectedWorkoutId` e `selectedDietId`;
- `recommendationsNeedRefresh` volta para `true` quando o aluno muda preferências;
- `planSelections` foi mantido como trilha best-effort para não bloquear o fluxo sem deploy de rules nesta PR.

## Guardrails

- não houve deploy nesta rodada
- não houve backfill apply
- não houve seed destrutivo amplo
- release externo continua bloqueado

## Veredito

Template Metadata + Recommendation Engine V1 validado para QA interno controlado
