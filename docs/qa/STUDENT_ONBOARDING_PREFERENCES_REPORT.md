# Student Onboarding + Preferences Report

Data da validação: 2026-05-14

## Veredito permitido

Template Metadata + Recommendation Engine V1 validado para QA interno controlado

## Escopo desta PR

- criar rota principal de onboarding do aluno;
- salvar base de preferências em `profiles/{uid}`;
- garantir bloqueio de assinatura antes do onboarding;
- permitir edição das preferências em `/app/profile`;
- preparar `/app/recommendations` como base para a engine V1.

## Estrutura salva no perfil

Campos validados no fluxo:

- `sex`
- `weightKg`
- `heightCm`
- `goal`
- `trainingFrequency`
- `trainingLevel`
- `trainingLocation`
- `dietPreference`
- `waterGoalMl`
- `onboardingCompleted`
- `onboardingCompletedAt`
- `updatedAt`
- `recommendationsNeedRefresh`

## Browser QA

### Cenário 1: member sem assinatura

- usuário QA configurado como `past_due` e `onboardingCompleted: false`
- login real levou para `/app/billing/lock`
- o member não entrou no onboarding

Evidência:

- `qa/student-onboarding-preferences/student-onboarding-billing-lock.png`

### Cenário 2: member ativo incompleto

- usuário QA configurado como `active` e `onboardingCompleted: false`
- login real levou para `/onboarding`
- o wizard exibiu:
  - boas-vindas
  - dados físicos
  - objetivo
  - rotina
  - preferência alimentar
  - água
  - revisão final

Evidências:

- `qa/student-onboarding-preferences/student-onboarding-step-welcome.png`
- `qa/student-onboarding-preferences/student-onboarding-review.png`

### Cenário 3: conclusão do onboarding

- conclusão redirecionou para `/app/recommendations`
- a tela agora exibe recomendações reais de treino e dieta com score explicável

Evidência:

- `qa/student-recommendations/onboarding-completed-to-recommendations.png`

### Cenário 4: edição no perfil

- `/app/profile` permitiu atualizar:
  - peso
  - objetivo
  - frequência
  - nível
  - local
  - preferência alimentar
  - meta de água
- após salvar, `recommendationsNeedRefresh` ficou `true`

Evidência:

- `qa/student-onboarding-preferences/student-profile-preferences-edit.png`

## Persistência conferida

Conferido após QA:

- `onboardingCompleted = true`
- `profiles/{uid}.onboardingCompleted = true`
- `recommendationsNeedRefresh = true` após edição em perfil
- `onboardingCompletedAt` salvo como Firestore Timestamp
- `updatedAt` salvo como Firestore Timestamp
- nenhum `undefined` validado no payload persistido

## Gates

| Comando | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run smoke:roles` | PASS |
| `npm run test:rules` | PASS |
| `npm run smoke:setup:dry` | PASS |
| `npm run backfill:date-fields -- --dry-run` | PASS (`wouldUpdate: 0`, `invalid: 0`) |

## Pendências assumidas para a próxima PR

- recommendation engine V1 já existe, mas ainda não é personalização avançada;
- `planSelections` remoto continua best-effort até próxima janela autorizada de deploy de rules;
- dashboard diário low ticket ainda não foi reorganizado para o novo fluxo.

## Guardrails

- não houve deploy
- não houve backfill apply
- não houve seed destrutivo amplo
- release externo continua bloqueado

## Veredito

Template Metadata + Recommendation Engine V1 validado para QA interno controlado
