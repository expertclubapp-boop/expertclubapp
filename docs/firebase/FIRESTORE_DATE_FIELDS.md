# Expert Club — Firestore Date Fields

## Status

Normalizacao preparada para QA interno controlado.

Nao declarar Beta externo, Production Ready ou pronto para escala por causa deste gate. Antes de usuario real, pagamento real ou dado real de cliente, reabrir a decisao de ambientes.

## Padrao oficial

Campos usados em `where`, `orderBy`, metricas, dashboards e backfills devem usar Firestore Timestamp.

ISO string so pode existir como campo derivado/read model, ou em chaves explicitas como `dateKey`, `weekKey` e `monthKey`.

Nao misturar Timestamp e string no mesmo campo novo. Documentos legados com ISO string devem ser lidos com compatibilidade e convertidos via backfill controlado.

## Helper central

Arquivo: `src/lib/firebase/date.ts`

| Funcao | Uso |
|---|---|
| `toFirestoreDate(value)` | Converte Timestamp, Date, ISO string legado ou number para Firestore Timestamp |
| `fromFirestoreDate(value)` | Converte Timestamp, Date, ISO string legado ou number para Date |
| `nowTimestamp()` | Gera Timestamp para novas escritas |
| `safeDateKey(value)` | Gera `YYYY-MM-DD` para campos de chave diaria |

## Campos normalizados

| Campo | Collection/Subcollection | Tipo oficial | Escrita atualizada | Leitura legado |
|---|---|---|---|---|
| `workoutSessions.startedAt` | `users/{uid}/workoutSessions/{id}` | Timestamp | `workoutSessionService`, seeds/smoke | Sim |
| `workoutSessions.completedAt` | `users/{uid}/workoutSessions/{id}` | Timestamp | `workoutSessionService`, backfill | Sim |
| `dietDays.createdAt` | `users/{uid}/dietDays/{dateKey}` | Timestamp | `dietDayService`, seeds/smoke | Sim |
| `dailyCheckins.createdAt` | `users/{uid}/dailyCheckins/{dateKey}` | Timestamp | `checkinService`, seeds/smoke | Sim |
| `bodyCheckins.createdAt` | `users/{uid}/bodyCheckins/{id}` | Timestamp | `bodyCheckinService` ja usava `serverTimestamp()` | Sim via backfill |
| `hydrationDays.createdAt` | `users/{uid}/hydrationDays/{dateKey}` | Timestamp | `hydrationService` | Sim via backfill |
| `users.createdAt` | `users/{uid}` | Timestamp | Auth/profile seeds/smoke | Sim via backfill |
| `subscriptions.createdAt` | `subscriptions/{uid}` | Timestamp | Auth/subscription admin seeds/smoke | Sim |
| `billingEvents.createdAt` | `billingEvents/{id}` | Timestamp | smoke/backfill | Sim |

## Queries normalizadas

Arquivo: `src/services/adminLaunchService.ts`

| Metrica | Query | Cursor |
|---|---|---|
| `workoutSessions7d` | `where('startedAt', '>=', sevenDaysAgo)` + `orderBy('startedAt', 'desc')` | Timestamp |
| `dietDays7d` | `where('createdAt', '>=', sevenDaysAgo)` + `orderBy('createdAt', 'desc')` | Timestamp |
| `dailyCheckins7d` | `where('createdAt', '>=', sevenDaysAgo)` + `orderBy('createdAt', 'desc')` | Timestamp |
| `checkoutSessions` | `where('createdAt', '>=', startDate)` | Timestamp |
| `billingEvents` | `where('createdAt', '>=', startDate)` | Timestamp |

## Firestore Rules

`firestore.rules` nao exige string para os campos de data usados neste gate. A unica comparacao temporal explicita observada e `auditLogs.createdAt == request.time`, fora das metricas normalizadas.

## Scripts atualizados

| Script | Status |
|---|---|
| `scripts/seed-qa-users.mjs` | Novas datas relevantes usam `admin.firestore.Timestamp` |
| `scripts/operationalSmokeSetup.mjs` | Novas datas relevantes usam `admin.firestore.Timestamp` |
| `scripts/seedPrescriptors.mjs` | Seeds de catalogo usam `admin.firestore.Timestamp` |
| `scripts/backfillDateFields.mjs` | Dry-run por padrao; `--apply` exige confirmacao explicita |

## Backfill

Comandos:

```bash
npm run backfill:date-fields -- --dry-run
npm run backfill:date-fields -- --dry-run --collection-group=workoutSessions
npm run backfill:date-fields -- --apply --confirm-apply --confirm-qa-project
```

Regras:

- dry-run e o padrao;
- `--apply` sem `--confirm-apply` e recusado;
- escrita em `expertcoaching-b91e2` exige `--confirm-qa-project`;
- ambiente marcado como production e recusado;
- documentos ja em Timestamp sao pulados;
- strings ISO legadas sao listadas e convertidas apenas no apply aprovado.

## Pendencia

Enquanto o backfill `--apply` nao for executado, documentos legados em ISO string podem continuar existindo. O codigo novo escreve Timestamp e le legado com seguranca, mas a limpeza completa do dataset depende de apply controlado.

## Dry-run em 2026-05-10

Comando:

```bash
npm run backfill:date-fields -- --dry-run
```

Resultado:

| Item | Resultado |
|---|---|
| Documentos escaneados | 59 |
| Documentos que seriam atualizados | 41 |
| Documentos atualizados | 0 |
| Campos já Timestamp | 80 |
| Campos ausentes | 72 |
| Campos inválidos | 0 |

O dry-run confirmou dados legados em `workoutSessions`, `dietDays`, `dailyCheckins`, `bodyCheckins`, `hydrationDays`, `users` e `subscriptions`.

## Validacoes

| Comando | Status |
|---|---|
| npm run typecheck | PASS |
| npm run build | PASS |
| npm run smoke:roles | PASS |
| npm run test:rules | PASS |
| npm run smoke:setup:dry | PASS; dry-run, sem escrita |
| npm run backfill:date-fields -- --dry-run | PASS; dry-run, sem escrita |
| npm run backfill:date-fields -- --dry-run --collection-group=workoutSessions | PASS; dry-run, sem escrita |

## Browser QA

| Rota | Usuario | Screenshot | Console | Status |
|---|---|---|---|---|
| /admin/dashboard | admin@expertclub.test | `qa/date-normalization/admin-dashboard-date-normalization-1440.png` | Sem erro operacional observado | PASS para validacao de tela |
