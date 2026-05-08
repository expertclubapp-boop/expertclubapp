# Expert Club — Firebase Environments

## Status

`expertcoaching-b91e2` esta confirmado pelo owner como ambiente unico de pre-lancamento / QA controlado enquanto nao houver usuarios reais.

O app ainda nao foi lancado publicamente, nao ha operacao comercial ativa no app e nao ha dados reais de alunos/clientes que precisem ser preservados como producao.

Os scripts de escrita exigem projeto explicito e confirmacao quando o alvo e `expertcoaching-b91e2`. Isso permite QA interno controlado sem tratar o projeto como staging/QA descartavel depois que houver usuarios reais.

Registro de decisao pendente: `docs/firebase/FIREBASE_ENVIRONMENT_DECISION_RECORD.md`.

Hosting oficial do frontend: Vercel. Firebase Hosting nao deve ser usado como criterio principal para classificar `expertcoaching-b91e2`.

As variaveis Firebase na Vercel foram vistas como disponiveis para Production and Preview. `VITE_FIREBASE_PROJECT_ID` em Production aponta para `expertcoaching-b91e2`, mas esse deploy e producao tecnica pre-lancamento, nao producao com usuarios reais.

Plano de separacao staging/QA: `docs/firebase/FIREBASE_STAGING_QA_SETUP.md`.

## Matriz de ambientes

| Ambiente | Project ID | Uso | Pode receber deploy de rules? | Pode receber usuarios reais? | Comandos permitidos | Status |
|---|---|---|---|---|---|---|
| pre-launch/QA | expertcoaching-b91e2 | QA interno, Vercel Production tecnica pre-lancamento, seeds/smoke controlados | Sim, com validacoes e confirmacao explicita | Nao | Seeds QA, smoke, rules deploy controlado | Confirmado pelo owner enquanto nao houver usuarios reais |
| staging/QA separado | Nao criado | Futuro ambiente de QA apos inicio de usuarios reais | Sim, apos criacao/confirmacao de projeto separado | Apenas testers | Seeds QA, smoke, rules deploy controlado | Pendente |
| production real | Nao formalizado | Ambiente para usuarios reais apos lancamento | Nao sem aprovacao formal | Sim | Somente deploy aprovado, sem seeds QA, sem smoke de escrita destrutiva | Pendente |

## Regra obrigatoria

- Nao executar deploy de rules para usuarios reais sem decisao formal de ambientes.
- Nao executar seed QA em ambiente com usuarios reais, pagamento real ou dados reais de clientes.
- Nao usar o projeto default do Firebase CLI como prova de ambiente.
- Todo script que escreve dados reais deve receber `--project=<projectId>` ou variavel `FIREBASE_PROJECT_ID`/`GCLOUD_PROJECT`.
- Enquanto nao houver usuarios reais, `expertcoaching-b91e2` pode ser usado como ambiente unico de pre-lancamento/QA com confirmacao explicita.
- No momento em que entrar usuario real, pagamento real ou dado real de cliente, `expertcoaching-b91e2` deve ser congelado como producao ou separado de QA imediatamente.

## Achados da auditoria local

| Arquivo | Project ID encontrado | Ambiente provavel | Observacao |
|---|---|---|---|
| `.firebaserc` | expertcoaching-b91e2 | pre-launch/QA | Alias production aponta para este projeto enquanto e producao tecnica pre-lancamento |
| `firebase use` | expertcoaching-b91e2 | pre-launch/QA | CLI ativo neste projeto |
| `.env.local` | expertcoaching-b91e2 | pre-launch/QA | Front local usa este projectId |
| `src/lib/firebase/firebase.ts` | via `VITE_FIREBASE_PROJECT_ID` | depende do env | Config le projectId do ambiente Vite |
| Firebase Console - Web app | expertcoaching-b91e2 | pre-launch/QA | App Web configurado no Firebase; frontend oficial esta na Vercel |
| Vercel Production | expertcoaching-b91e2 | pre-launch/QA | `VITE_FIREBASE_PROJECT_ID` em Production aponta para este projeto, sem usuarios reais no momento da decisao |
| Vercel Preview | expertcoaching-b91e2 | pre-launch/QA | Preview tambem aponta para este projeto |
| Vercel Development | Nao configurado nesta variavel | pendente | Desenvolvimento nao marcado na variavel |
| `.firebaserc` staging alias | expertclub-staging | staging/QA sugerido | Alias preparado; projeto ainda precisa existir |
| `.firebaserc` production alias | expertcoaching-b91e2 | pre-launch/QA | Alias explicito para producao tecnica pre-lancamento |
| `package.json` | expertclub-staging | staging/QA sugerido | Comandos QA agora apontam para comandos `:staging` |
| `scripts/seed-qa-users.mjs` | expertclub-staging via `--staging` | staging/QA sugerido | Escreve em staging por padrao nos comandos QA |
| `scripts/operationalSmokeSetup.mjs` | expertclub-staging via `--staging` | staging/QA sugerido | Escreve em staging por padrao nos comandos smoke |
| `scripts/seedPrescriptors.mjs` | expertclub-staging via `--staging` | staging/QA sugerido | Escreve em staging por padrao |
| `scripts/backfillMentorAssignments.mjs` | expertclub-staging via `--staging` | staging/QA sugerido | Escreve em staging por padrao, usar dry-run antes |
| `scripts/setup-test-users.js` | expertcoaching-b91e2 guardado | pre-launch/QA | Script legado protegido por `--project` e `--confirm-qa-project` |
| `scripts/smoke-test-triggers.ts` | expertcoaching-b91e2 guardado | pre-launch/QA | Script legado protegido por `--project` e `--confirm-qa-project` |
| `functions/setup-test-users.js` | expertcoaching-b91e2 guardado | pre-launch/QA | Script legado protegido por `--project` e `--confirm-qa-project` |
| `functions/smoke-test.js` | expertcoaching-b91e2 guardado | pre-launch/QA | Script legado protegido por `--project` e `--confirm-qa-project` |
| `.github/` | Nao encontrado | n/a | Nao ha workflow CI versionado no repo raiz |

## Guardrails implementados

- `npm run qa:seed-users` chama `npm run qa:seed-users:staging`.
- `npm run smoke:setup` chama `npm run smoke:setup:staging`.
- `npm run seed:prescriptors` chama `npm run seed:prescriptors:staging`.
- `npm run backfill:mentor-assignments` chama `npm run backfill:mentor-assignments:staging`.
- Os comandos `:staging` usam `--staging`, que resolve para `EXPERT_CLUB_STAGING_PROJECT_ID` ou `expertclub-staging`.
- Scripts de escrita recusam execucao se `EXPERT_CLUB_FIREBASE_ENV=production` ou `FIREBASE_ENV=production`.
- Scripts de escrita recusam `expertcoaching-b91e2` sem `--confirm-qa-project` ou `EXPERT_CLUB_CONFIRM_QA_PROJECT=true`.

## Variaveis operacionais

| Variavel | Uso |
|---|---|
| `FIREBASE_PROJECT_ID` | Project ID explicito para Admin SDK/scripts |
| `GCLOUD_PROJECT` | Project ID alternativo usado por Google SDK |
| `VITE_FIREBASE_PROJECT_ID` | Project ID usado pelo front Vite |
| `EXPERT_CLUB_STAGING_PROJECT_ID` | Project ID staging/QA usado pelos comandos `:staging` |
| `EXPERT_CLUB_PRODUCTION_PROJECT_ID` | Project ID sensivel/producao operacional |
| `EXPERT_CLUB_FIREBASE_ENV` | Ambiente declarado: `unconfirmed`, `dev`, `staging`, `qa` ou `production` |
| `FIREBASE_ENV` | Alias operacional para scripts |
| `EXPERT_CLUB_CONFIRM_QA_PROJECT` | Confirmacao explicita para scripts de escrita em `expertcoaching-b91e2` |

## Risco

Como a Vercel Production usa `expertcoaching-b91e2`, seeds QA, deploys de rules, indices e alteracoes de dados neste projeto podem afetar o frontend publicado. Isso e aceitavel apenas enquanto o app estiver em pre-lancamento, sem usuarios reais, sem pagamento real e sem dados reais de clientes.

`VITE_ENABLE_DEV_SEED` foi removida/restringida de Production na Vercel. Seeds de QA devem rodar via scripts Admin SDK com guardrails, nao por fluxo client.

## Regras de decisao

- Enquanto nao houver usuarios reais, `expertcoaching-b91e2` pode ser usado como ambiente unico de pre-lancamento/QA.
- No momento em que entrar usuario real, pagamento real ou dado real de cliente, `expertcoaching-b91e2` deve ser congelado como producao ou separado de QA imediatamente.
- Antes de Beta externo ou release publico, escolher uma estrategia final: manter `expertcoaching-b91e2` como producao e criar staging/QA, manter como staging/QA e criar production, ou criar dev/staging/production separados.
