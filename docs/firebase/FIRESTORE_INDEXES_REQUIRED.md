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

## Implementacao

Arquivos:

- `firestore.indexes.json`
- `firebase.json`
- `src/services/adminLaunchService.ts`

Os indices foram configurados como single-field collection group indexes via `fieldOverrides`, porque o Firebase recusou os mesmos campos como indices compostos com a mensagem:

`this index is not necessary, configure using single field index controls`

O arquivo `firestore.indexes.json` tambem preserva os indices compostos que ja existiam no projeto remoto para evitar drift operacional.

## Queries afetadas

Arquivo: `src/services/adminLaunchService.ts`

| Metrica | Collection Group | Estado atual |
|---|---|---|
| workoutSessions7d | workoutSessions | `where('startedAt', '>=', Timestamp)` + `orderBy('startedAt', 'desc')` |
| dietDays7d | dietDays | `where('createdAt', '>=', Timestamp)` + `orderBy('createdAt', 'desc')` |
| dailyCheckins7d | dailyCheckins | `where('createdAt', '>=', Timestamp)` + `orderBy('createdAt', 'desc')` |

## Deploy

Projeto: `expertcoaching-b91e2`

Comando:

```bash
firebase deploy --only firestore:indexes --project expertcoaching-b91e2
```

Resultado: PASS.

Observacao: o primeiro teste de browser pegou os indices ainda propagando. O dashboard exibiu erro `COLLECTION_GROUP_DESC index ... not ready yet` para `workoutSessions.startedAt` e depois `dailyCheckins.createdAt`. Apos aguardar a propagacao e tentar novamente, o dashboard carregou sem erro operacional.

## Browser validation

| Rota | Usuario | Screenshot | Permission denied? | Erro de indice? | Status |
|---|---|---|---|---|---|
| /admin/dashboard | admin@expertclub.test | `qa/firestore-indexes/admin-dashboard-index-validation-final.png` | Nao | Nao | PASS |

## Outras queries collectionGroup observadas

Arquivo: `src/services/adminMetricsService.ts`

| Collection Group | Uso atual | Observacao |
|---|---|---|
| dailyCheckins | leitura global admin | Sem filtro server-side hoje |
| bodyCheckins | leitura global admin | Sem filtro server-side hoje |
| workoutSessions | leitura global admin | Sem filtro server-side hoje |
| dietDays | leitura global admin | Sem filtro server-side hoje |
| hydrationDays | leitura global admin | Sem filtro server-side hoje |

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
