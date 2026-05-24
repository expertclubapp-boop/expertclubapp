# Admin Prescription Operations Report

Data da rodada: 2026-05-13

## Objetivo

Concluir o hardening do caminho de leitura de `prescriptionAssignments` no ambiente remoto real, sem fallback de auditoria.

## Confirmações de ambiente

- Browser local validado em `http://127.0.0.1:4173`
- `firebaseApp.options.projectId`: `expertcoaching-b91e2`
- `.env.local`: `VITE_FIREBASE_PROJECT_ID=expertcoaching-b91e2`
- `.firebaserc`: alias `production -> expertcoaching-b91e2`
- Usuário `admin@expertclub.test` autenticado com:
  - claim `role: admin`
  - documento de usuário com `role: admin`
  - `Default Route: /admin/dashboard`

## Rules locais

Path oficial:

`users/{studentId}/prescriptionAssignments/{assignmentId}`

Regra aplicada:

```txt
match /users/{uid}/prescriptionAssignments/{assignmentId} {
  allow get, list: if isOwner(uid) || isAdmin();
  allow create, update, delete: if isAdmin();
}
```

## Deploy executado

Comando:

```bash
firebase deploy --only firestore:rules --project expertcoaching-b91e2
```

Resultado:

- compile de `firestore.rules`: PASS
- upload e release para `cloud.firestore`: PASS

Nenhum deploy de:

- indexes
- functions
- hosting

## Rules tests

`npm run test:rules` ficou `50/50 PASS`.

Cenários cobertos:

- admin lista, cria e atualiza assignments
- aluno lê e lista os próprios assignments
- aluno não cria e não atualiza
- outro aluno não lê
- affiliate não lê
- mentor puro não lê

## Browser QA pós-deploy

### Admin

Rotas:

- `/admin/users/:id?tab=treino`
- `/admin/users/:id?tab=dieta`

Resultado:

- histórico carregou por leitura direta
- `PERMISSION_DENIED`: não ocorreu
- `FAILED_PRECONDITION`: não ocorreu
- fallback de auditoria: não voltou
- após atribuição real nova, o histórico passou a mostrar item real

### Aluno

Rotas:

- `/app/workouts`
- `/app/diets/today`
- `/app/profile`

Resultado:

- plano atual carregou normalmente
- sem `permission-denied`
- tentativa de abrir `/admin/users/:id` redirecionou para `/app/today`

### Segurança

- `smoke:roles` manteve member fora do admin
- browser manteve mentor fora do admin (`/mentor/overview`)
- affiliate e outro aluno seguem cobertos por `test:rules`

## Evidências

- `qa/prescription-assignments-read-path/admin-workout-history-direct-read-after-rules-deploy.png`
- `qa/prescription-assignments-read-path/admin-diet-history-direct-read-after-rules-deploy.png`
- `qa/prescription-assignments-read-path/student-plan-after-rules-deploy.png`

## Validações

| Validação | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run smoke:roles` | PASS |
| `npm run test:rules` | PASS (50/50) |
| `npm run smoke:setup:dry` | PASS |
| `npm run backfill:date-fields -- --dry-run` | PASS (`wouldUpdate: 0`, `invalid: 0`) |
| pós-deploy `npm run smoke:roles` | PASS |
| pós-deploy `npm run test:rules` | PASS |
| pós-deploy `npm run smoke:setup:dry` | PASS |

## Veredito

**Prescription Assignments Read Path validado no ambiente remoto**
