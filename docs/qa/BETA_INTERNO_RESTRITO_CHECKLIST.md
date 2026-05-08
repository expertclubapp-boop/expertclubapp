# Expert Club — Beta Interno Restrito Checklist

## Status

Aluno V2 completo para QA interno e projeto ainda limitado a QA interno controlado.

Nao e Beta externo. Nao e Production Ready.

Status oficial de release: `docs/release/PROJECT_STATUS.md`.

## Escopo liberado

### Liberado para testers internos

- Aluno V2 mobile
- Mentor overview/alunos/checkins/financeiro/prescritores
- Admin dashboard/users/subscriptions/content/financeiro
- Auth real
- Firestore Rules testadas

### Aluno

- /app/today
- /app/workouts
- /app/workouts/:id
- /app/workouts/session/:id
- /app/diets
- /app/diets/today
- /app/checkin/daily
- /app/checkin/weekly
- /app/content
- /app/challenges
- /app/profile
- /app/billing

### Mentor

- /mentor/overview
- /mentor/alunos
- /mentor/checkins
- /mentor/financeiro
- /mentor/influencers
- /mentor/treinos/prescritor
- /mentor/dietas/prescritor

### Admin

- /admin/dashboard
- /admin/users
- /admin/users/:id
- /admin/subscriptions
- /admin/affiliates
- /admin/content
- /admin/financeiro
- /admin/workspaces
- /admin/support

## Nao aprovado ainda

- Beta externo
- Production Ready
- "100% V2" publico/produto completo
- Escala com muitos usuarios
- Deploy em projectId nao confirmado
- Admin dashboard com filtros em memoria em escala
- Qualquer ambiente sem rollback plan
- Dashboard com filtros collectionGroup server-side definitivos
- Deploy production sem revisao de ambiente

## Usuarios QA

- admin@expertclub.test
- mentor@expertclub.test
- student@expertclub.test
- student2@expertclub.test

## Comandos obrigatorios antes de cada QA

- npm run qa:seed-users
- npm run typecheck
- npm run build
- npm run smoke:roles
- npm run test:rules

## Requisitos antes de convidar testers reais

- Confirmar que `expertcoaching-b91e2` e staging/QA, nao producao
- Revisar screenshots em `qa/student-v2-parity/REVIEW.md`
- Ter rollback plan em `docs/release/ROLLBACK_PLAN.md`
- Rodar comandos obrigatorios
- Criar lista de testers
- Definir canal de feedback
- Definir responsavel por triagem de bugs
- Compartilhar `docs/qa/BUG_REPORT_TEMPLATE.md`

## Ambiente Firebase

| Ambiente | Project ID | Uso | Status |
|---|---|---|---|
| dev | Nao formalizado | Desenvolvimento local | Pendente |
| staging/QA | expertcoaching-b91e2 | Projeto usado por `.env.local`, `.firebaserc`, `firebase use`, seed QA e deploy de rules | Precisa confirmacao formal |
| production | Nao formalizado | Producao | Pendente |

Ver detalhes em `docs/firebase/FIREBASE_ENVIRONMENTS.md`.

## Student V2 screenshots

Pasta obrigatoria: `qa/student-v2-parity/`

| Rota | 390x844 | 430x932 | Status |
|---|---|---|---|
| /app/today | `student-today-390.png` | `student-today-430.png` | PASS |
| /app/workouts | `student-workouts-390.png` | `student-workouts-430.png` | PASS |
| /app/workouts/:id | `student-workout-detail-390.png` | `student-workout-detail-430.png` | PASS |
| /app/workouts/session/:id | `student-workout-session-390.png` | `student-workout-session-430.png` | PASS |
| /app/diets | `student-diets-390.png` | `student-diets-430.png` | PASS |
| /app/diets/today | `student-diet-today-390.png` | `student-diet-today-430.png` | PASS |
| /app/checkin/daily | `student-checkin-daily-390.png` | `student-checkin-daily-430.png` | PASS |
| /app/checkin/weekly | `student-checkin-weekly-390.png` | `student-checkin-weekly-430.png` | PASS |
| /app/content | `student-content-390.png` | `student-content-430.png` | PASS |
| /app/challenges | `student-challenges-390.png` | `student-challenges-430.png` | PASS |
| /app/profile | `student-profile-390.png` | `student-profile-430.png` | PASS para QA interno |
| /app/billing | `student-billing-390.png` | `student-billing-430.png` | PASS para QA interno |

## Regras de comunicacao

Use: "Estamos em QA interno controlado. O aluno esta V2 para QA interno, mas ainda precisamos formalizar ambientes Firebase, criar indices Firestore e ampliar validacao visual antes de Beta externo."

Nao usar:

- "Production Ready"
- "Beta externo"
- "100% V2"
- "pronto para usuarios reais sem ressalva"
