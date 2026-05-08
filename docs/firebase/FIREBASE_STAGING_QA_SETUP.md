# Expert Club — Firebase Staging/QA Setup

## Objetivo

Preparar a separacao de um Firebase staging/QA para quando o projeto deixar o pre-lancamento ou quando o owner decidir separar QA antes de usuarios reais.

`expertcoaching-b91e2` esta ligado a Vercel Production, mas foi classificado pelo owner como ambiente unico de pre-lancamento / QA controlado enquanto nao houver usuarios reais, pagamento real ou dados reais de clientes.

No momento em que entrar usuario real, pagamento real ou dado real de cliente, `expertcoaching-b91e2` deve ser congelado como producao ou separado de QA imediatamente.

## Projeto sugerido

| Ambiente | Project ID sugerido | Uso | Status |
|---|---|---|---|
| staging/QA | `expertclub-staging` | QA interno, Vercel Preview, seeds, smoke, validacao de rules e indexes | Pendente de criacao |
| dev | `expertclub-dev` | Desenvolvimento local se nao usar Emulator | Opcional |
| pre-launch/QA | `expertcoaching-b91e2` | Vercel Production tecnica pre-lancamento e QA controlado | Confirmado pelo owner enquanto nao houver usuarios reais |

O projectId final pode mudar, mas deve ser registrado em:

- `.firebaserc`
- `.env.local`
- `.env.example`
- Vercel Preview environment variables
- `docs/firebase/FIREBASE_ENVIRONMENTS.md`
- `docs/firebase/FIREBASE_ENVIRONMENT_DECISION_RECORD.md`

## Permissoes

| Acao | staging/QA futuro | pre-launch/QA atual |
|---|---|---|
| Seed QA | Permitido | Permitido com confirmacao explicita enquanto nao houver usuarios reais |
| Smoke setup | Permitido | Permitido com confirmacao explicita enquanto nao houver usuarios reais |
| Deploy Firestore Rules | Permitido apos `npm run test:rules` | Permitido com validacoes e aprovacao do owner enquanto pre-lancamento |
| Criar indexes | Permitido para validar dashboard | Permitido com cautela enquanto pre-lancamento; reavaliar antes de escala |
| Backfill | Permitido com dry-run previo | Permitido com dry-run e confirmacao explicita enquanto pre-lancamento |

## Comandos permitidos em staging

```bash
npm run qa:seed-users:staging
npm run smoke:setup:staging
npm run seed:prescriptors:staging
npm run backfill:mentor-assignments:staging -- --dry-run
npm run test:rules
npm run typecheck
npm run build
npm run smoke:roles
```

Se o projectId final nao for `expertclub-staging`, configurar:

```bash
EXPERT_CLUB_STAGING_PROJECT_ID=<novo-project-id>
```

## Vercel mapping obrigatorio

| Ambiente Vercel | Firebase projectId | Status desejado |
|---|---|---|
| Production | `expertcoaching-b91e2` | Manter enquanto pre-lancamento |
| Preview | `expertclub-staging` ou projectId staging final | Atualizar quando staging/QA separado for criado |
| Development | `expertclub-staging`, `expertclub-dev` ou Emulator | Definir conforme operacao local |

## Passos depois que o Firebase staging existir

1. Criar o projeto Firebase staging/QA.
2. Ativar Authentication com os provedores necessarios.
3. Criar Firestore e Storage conforme necessidade do QA.
4. Atualizar Vercel Preview para apontar para o projectId staging/QA.
5. Publicar Firestore Rules no staging:

```bash
firebase deploy --only firestore:rules --project <staging-project-id>
```

6. Rodar:

```bash
npm run test:rules
npm run qa:seed-users:staging
npm run smoke:setup:staging
npm run seed:prescriptors:staging
npm run typecheck
npm run build
npm run smoke:roles
```

7. Validar browser com usuarios reais de QA no ambiente Preview.
8. Criar/validar indexes Firestore no staging antes de qualquer mudanca em ambiente com usuarios reais.

## Criterio de aceite

- `expertcoaching-b91e2` nao e mais usado como QA depois que houver usuarios reais, pagamento real ou dados reais de clientes.
- Vercel Preview aponta para staging/QA.
- Seeds e smoke escrevem apenas no staging.
- Firestore Rules sao validadas primeiro no staging.
- Production real fica protegida.
