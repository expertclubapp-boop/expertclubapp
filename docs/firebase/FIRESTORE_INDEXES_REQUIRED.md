# Expert Club — Firestore Indexes Required

## Status

Indices Firestore criados e filtros server-side restaurados para QA interno controlado.

Este status vale para o ambiente unico de pre-lancamento / QA controlado `expertcoaching-b91e2`, enquanto nao houver usuarios reais, pagamento real ou dados reais de clientes.

Nao declarar Production Ready, Beta externo ou pronto para escala por causa deste gate. Antes de usuario real, reabrir a decisao de ambientes.

## Status operacional

Permitido para QA interno controlado.

Antes de escala ou producao real, validar novamente:

- estrategia final de ambientes;
- volume esperado de dados;
- custos e latencia das queries;
- `/admin/dashboard` com admin real no ambiente final.

## Indices do Launch Dashboard

| Collection Group | Campo | Filtro | OrderBy | Servico | Indice criado? | Validado no browser? | Status |
|---|---|---|---|---|---|---|---|
| workoutSessions | startedAt | >= sevenDaysAgo | startedAt desc | adminLaunchService | Sim | Sim | Criado e validado |
| dietDays | createdAt | >= sevenDaysAgo | createdAt desc | adminLaunchService | Sim | Sim | Criado e validado |
| dailyCheckins | createdAt | >= sevenDaysAgo | createdAt desc | adminLaunchService | Sim | Sim | Criado e validado |
| bodyCheckins | createdAt | >= monthAgo | createdAt desc | adminMetricsService | Criado e validado para QA interno | Sim | Necessario para hardening de metricas |

## AdminMetricsService Query Hardening

Status: implementado no codigo e deployado para QA interno controlado.

| Servico | Query | Collection/Group | Filtro | OrderBy | Limit | Risco tratado |
|---|---|---|---|---|---|---|
| adminMetricsService | users.member.limited | users | role == member | - | 500 | Evita ler todos os usuarios globais. |
| adminMetricsService | subscriptions.status.limited | subscriptions | status in estados acompanhados | - | 1000 | Evita scan total de assinaturas. |
| adminMetricsService | affiliateAccounts.limited | affiliateAccounts | - | - | 100 | Recorte para ranking de afiliadas. |
| adminMetricsService | commissionLedger.status.limited | commissionLedger | status in pending/approved/paid | - | 1000 | Evita scan total do ledger. |
| adminMetricsService | dailyCheckins.7d | dailyCheckins | createdAt >= 7d | createdAt desc | 500 | Remove collectionGroup global ilimitado. |
| adminMetricsService | bodyCheckins.30d | bodyCheckins | createdAt >= 30d | createdAt desc | 500 | Remove collectionGroup global ilimitado; requer indice novo. |
| adminMetricsService | workoutSessions.7d | workoutSessions | startedAt >= 7d | startedAt desc | 500 | Usa indice ja validado e evita scan global. |
| adminMetricsService | dietDays.30d | dietDays | createdAt >= 30d | createdAt desc | 500 | Usa indice ja validado e evita media all-time ilimitada. |
| adminMetricsService | hydrationDays.sample | hydrationDays | - | - | 300 | Mantem recorte limitado sem exigir indice novo. |
| adminLaunchService | checkoutSessions.range.limited | checkoutSessions | createdAt >= range | createdAt desc | 500 | Recorta eventos por periodo. |
| adminLaunchService | billingEvents.range.limited | billingEvents | createdAt >= range | createdAt desc | 500 | Recorta eventos por periodo. |
| adminLaunchService | users.member.limited | users | role == member | - | 1000 | Evita scan total de usuarios. |
| adminLaunchService | profiles.limited | profiles | - | - | 1000 | Recorte honesto para alertas de onboarding/dieta/treino. |
| adminLaunchService | affiliateAccounts.limited | affiliateAccounts | - | - | 100 | Recorte para tabela de afiliadas. |
| adminLaunchService | commissionLedger.status.limited | commissionLedger | status in approved/paid | - | 1000 | Evita scan total de comissoes. |
| adminLaunchService | workoutSessions.7d | workoutSessions | startedAt >= 7d | startedAt desc | 500 | Ja filtrado, agora tambem limitado. |
| adminLaunchService | dietDays.7d | dietDays | createdAt >= 7d | createdAt desc | 500 | Ja filtrado, agora tambem limitado. |
| adminLaunchService | dailyCheckins.7d | dailyCheckins | createdAt >= 7d | createdAt desc | 500 | Ja filtrado, agora tambem limitado. |

## Tratamento de erro

- `permission-denied` continua subindo como erro real e nao e convertido para zero.
- Metricas secundarias de atividade usam `Promise.allSettled`; falhas nao-permissao viram alerta informativo e recorte vazio, sem derrubar todo o dashboard.
- Metricas criticas de receita, usuarios, assinaturas, afiliadas e comissoes continuam falhando de forma explicita.

## Implementacao

Arquivos:

- `firestore.indexes.json`
- `firebase.json`
- `src/services/adminLaunchService.ts`
- `src/services/adminMetricsService.ts`

Os indices foram configurados como single-field collection group indexes via `fieldOverrides`, porque o Firebase recusou os mesmos campos como indices compostos com a mensagem:

`this index is not necessary, configure using single field index controls`

O arquivo `firestore.indexes.json` tambem preserva os indices compostos que ja existiam no projeto remoto para evitar drift operacional.

## Queries afetadas

Arquivo: `src/services/adminLaunchService.ts`

| Metrica | Collection Group | Estado atual |
|---|---|---|
| workoutSessions7d | workoutSessions | `where('startedAt', '>=', Timestamp)` + `orderBy('startedAt', 'desc')` + `limit(500)` |
| dietDays7d | dietDays | `where('createdAt', '>=', Timestamp)` + `orderBy('createdAt', 'desc')` + `limit(500)` |
| dailyCheckins7d | dailyCheckins | `where('createdAt', '>=', Timestamp)` + `orderBy('createdAt', 'desc')` + `limit(500)` |
| bodyCheckins30d | bodyCheckins | `where('createdAt', '>=', Timestamp)` + `orderBy('createdAt', 'desc')` + `limit(500)`; Criado e validado |

## Deploy

Projeto: `expertcoaching-b91e2`

Comando:

```bash
firebase deploy --only firestore:indexes --project expertcoaching-b91e2
```

Resultado: PASS.

Observacao: o primeiro teste de browser pegou os indices ainda propagando. O dashboard exibiu erro `COLLECTION_GROUP_DESC index ... not ready yet` para `workoutSessions.startedAt` e depois `dailyCheckins.createdAt`. Apos aguardar a propagacao e tentar novamente, o dashboard carregou sem erro operacional.

O indice novo `bodyCheckins.createdAt` foi deployado e validado para o ambiente `expertcoaching-b91e2`.

## Browser validation

| Rota | Usuario | Screenshot | Permission denied? | Erro de indice? | Status |
|---|---|---|---|---|---|
| /admin/dashboard | admin@expertclub.test | `qa/firestore-indexes/admin-dashboard-bodycheckins-index.png` | Nao | Nao | PASS |
| /admin/metrics | admin@expertclub.test | `qa/firestore-indexes/admin-metrics-bodycheckins-index.png` | Nao | Nao | PASS |

## Outras queries collectionGroup observadas

Arquivo: `src/services/adminMetricsService.ts`

| Collection Group | Uso atual | Observacao |
|---|---|---|
| dailyCheckins | adminMetricsService | `createdAt >= weekAgo` + `orderBy('createdAt', 'desc')` + `limit(500)` |
| bodyCheckins | adminMetricsService | `createdAt >= monthAgo` + `orderBy('createdAt', 'desc')` + `limit(500)` |
| workoutSessions | adminMetricsService | `startedAt >= weekAgo` + `orderBy('startedAt', 'desc')` + `limit(500)` |
| dietDays | adminMetricsService | `createdAt >= monthAgo` + `orderBy('createdAt', 'desc')` + `limit(500)` |
| hydrationDays | adminMetricsService | `limit(300)` sem order/filtro para nao exigir indice novo |

Arquivo: `src/services/communityFeedService.ts`

| Collection/Group | Filtro | OrderBy | Observacao |
|---|---|---|---|
| community_posts | status == published | createdAt desc/asc | Fora deste gate; rastrear antes de escala se virar fluxo critico |

## Validacoes

| Comando | Status |
|---|---|
| firebase deploy --only firestore:indexes --project expertcoaching-b91e2 | PASS |
| npm run test:rules | PASS |
| npm run typecheck | PASS |
| npm run build | PASS |
| npm run smoke:roles | PASS |
| npm run smoke:setup:dry | PASS; dry-run, sem escrita |

## Observacao de schema

O dashboard agora usa cursores Timestamp para `startedAt` e `createdAt`.

O padrao oficial esta documentado em `docs/firebase/FIRESTORE_DATE_FIELDS.md`.

Enquanto o backfill `--apply` nao for executado, podem existir documentos legados com ISO string. O codigo novo escreve Timestamp e le legado com compatibilidade, mas a limpeza completa do dataset depende de backfill controlado.
