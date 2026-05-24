# Expert Club — Backfill Date Fields Review

## Status

Preparado para revisão operacional.
Apply ainda não executado.

## Comandos executados

| Comando | Status |
|---|---|
| `npm run backfill:date-fields -- --dry-run` | PASS |

## Resumo do dry-run (2026-05-10)

| Item | Resultado |
|---|---|
| Documentos escaneados | 59 |
| Documentos que seriam atualizados | 41 |
| Campos já Timestamp | 80 |
| Campos ISO string legados | 41 (seriam convertidos) |
| Campos ausentes | 72 |
| Campos inválidos | 0 |
| Escritas realizadas | 0 |

## Escopo de Coleções e Campos

| Collection/Group | Campo | Backfill incluso? | Observação |
|---|---|---|---|
| workoutSessions (CG) | startedAt, completedAt, finishedAt, lastInteractionAt, inactiveWarningShownAt, createdAt, updatedAt | Sim | CG = Collection Group |
| dietDays (CG) | createdAt, updatedAt | Sim | |
| dailyCheckins (CG) | createdAt, updatedAt | Sim | |
| bodyCheckins (CG) | createdAt, updatedAt | Sim | |
| hydrationDays (CG) | createdAt, updatedAt | Sim | |
| users | createdAt, updatedAt, lastLoginAt | Sim | |
| subscriptions | startedAt, currentPeriodStart, currentPeriodEnd, renewalDate, cancelledAt, expiresAt, createdAt, updatedAt | Sim | |
| billingEvents | createdAt, updatedAt, processedAt, paidAt | Sim | |

## Riscos

| Risco | Mitigação |
|---|---|
| Corrupção de dados por formato inválido | Script valida o formato antes de converter; dry-run reportou 0 campos inválidos. |
| Perda de histórico original | O backup/snapshot lógico deve ser extraído antes do apply. |
| Inconsistência durante o deploy | O app já lê ambos os formatos, então a migração é transparente. |

## Documentos afetados (41 total)

| Path | Campos a converter |
|---|---|
| users/2GI57LeVLcWtyFqPdhUBlVeDJ202/workoutSessions/qa-session | startedAt, completedAt, lastInteractionAt, createdAt, updatedAt |
| users/KqZNsfTOxJWo7MUUD5EUFC5cS042/workoutSessions/qa-session | startedAt, completedAt, lastInteractionAt, createdAt, updatedAt |
| users/q9qzBNVh93Pb0ujhEv4q83rTFZ73/workoutSessions/5vO8Mdh8EA5xnI844l8O | completedAt |
| users/q9qzBNVh93Pb0ujhEv4q83rTFZ73/workoutSessions/omLOcrJ6CXdWPJ03n0QA | completedAt |
| users/2GI57LeVLcWtyFqPdhUBlVeDJ202/dietDays/2026-05-07 | createdAt, updatedAt |
| users/4Atirn3X24g6b8jTId5sSS6BkxC2/dietDays/2026-05-04 | createdAt, updatedAt |
| users/KqZNsfTOxJWo7MUUD5EUFC5cS042/dietDays/2026-05-07 | createdAt, updatedAt |
| users/2GI57LeVLcWtyFqPdhUBlVeDJ202/dailyCheckins/2026-05-07 | createdAt, updatedAt |
| users/KqZNsfTOxJWo7MUUD5EUFC5cS042/dailyCheckins/2026-05-07 | createdAt, updatedAt |
| users/q9qzBNVh93Pb0ujhEv4q83rTFZ73/dailyCheckins/2026-05-01 | createdAt, updatedAt |
| users/2GI57LeVLcWtyFqPdhUBlVeDJ202/bodyCheckins/qa-body | createdAt, updatedAt |
| users/KqZNsfTOxJWo7MUUD5EUFC5cS042/bodyCheckins/qa-body | createdAt, updatedAt |
| users/2GI57LeVLcWtyFqPdhUBlVeDJ202/hydrationDays/2026-05-07 | createdAt, updatedAt |
| users/KqZNsfTOxJWo7MUUD5EUFC5cS042/hydrationDays/2026-05-07 | createdAt, updatedAt |
| users/1qvkudqmK6Wg42ebVIYEc5nKDL43 | createdAt |
| users/2GI57LeVLcWtyFqPdhUBlVeDJ202 | createdAt |
| users/6vCkv26kp4PNtvW9QhLZ7VJTQ7B3 | createdAt |
| users/KqZNsfTOxJWo7MUUD5EUFC5cS042 | createdAt, updatedAt |
| users/ORqR86Zn2IXNfuxNHYc2Rr03DF42 | createdAt, updatedAt, lastLoginAt |
| users/ZoVs2c3fmBOaVMMnPQd8xyXKPnt2 | createdAt, updatedAt |
| users/cCY4sENSzAX2iBNVewoB406JXKX2 | createdAt |
| users/k7ABRh3xq4R001OuqRlV1RV2HkE3 | createdAt |
| users/mbq9Wd2V9pgjbAnyCbz0bXYiDyB2 | createdAt, updatedAt, lastLoginAt |
| users/q9qzBNVh93Pb0ujhEv4q83rTFZ73 | createdAt |
| subscriptions/0jzqCj387KQsdXXZD8TsucW3H1G3 | startedAt, currentPeriodStart, currentPeriodEnd, createdAt, updatedAt |
| subscriptions/1qvkudqmK6Wg42ebVIYEc5nKDL43 | startedAt, currentPeriodStart, currentPeriodEnd, createdAt, updatedAt |
| subscriptions/2GI57LeVLcWtyFqPdhUBlVeDJ202 | startedAt, currentPeriodStart, currentPeriodEnd, renewalDate, createdAt, updatedAt |
| subscriptions/4Atirn3X24g6b8jTId5sSS6BkxC2 | startedAt, currentPeriodStart, currentPeriodEnd, createdAt, updatedAt |
| subscriptions/5fDQftCCt9gIRdeV7zVUdl8exmC2 | startedAt, currentPeriodStart, currentPeriodEnd, createdAt, updatedAt |
| subscriptions/6vCkv26kp4PNtvW9QhLZ7VJTQ7B3 | startedAt, currentPeriodStart, currentPeriodEnd, createdAt, updatedAt |
| subscriptions/BYRlA3AZ1ySwBf9V1RTiBV8E2Fz2 | startedAt, currentPeriodStart, currentPeriodEnd, createdAt, updatedAt |
| subscriptions/Ef522P3u6CPD6zAiofCrpdFvYKB3 | startedAt, currentPeriodStart, currentPeriodEnd, createdAt, updatedAt |
| subscriptions/F1wgMpk6fKPet8OStQTTj9VUwAI2 | startedAt, currentPeriodStart, currentPeriodEnd, createdAt, updatedAt |
| subscriptions/KqZNsfTOxJWo7MUUD5EUFC5cS042 | startedAt, currentPeriodStart, currentPeriodEnd, renewalDate, createdAt, updatedAt |
| subscriptions/ORqR86Zn2IXNfuxNHYc2Rr03DF42 | currentPeriodStart, currentPeriodEnd, renewalDate, createdAt, updatedAt |
| subscriptions/ZoVs2c3fmBOaVMMnPQd8xyXKPnt2 | startedAt, currentPeriodStart, currentPeriodEnd, renewalDate, createdAt, updatedAt |
| subscriptions/bMR2bRc5pmf1PlY2X06BJmoVqdg2 | startedAt, currentPeriodStart, currentPeriodEnd, createdAt, updatedAt |
| subscriptions/cCY4sENSzAX2iBNVewoB406JXKX2 | startedAt, currentPeriodStart, currentPeriodEnd, renewalDate, createdAt, updatedAt |
| subscriptions/k7ABRh3xq4R001OuqRlV1RV2HkE3 | currentPeriodStart, currentPeriodEnd, createdAt, updatedAt |
| subscriptions/mbq9Wd2V9pgjbAnyCbz0bXYiDyB2 | currentPeriodStart, currentPeriodEnd, createdAt, updatedAt |
| subscriptions/q9qzBNVh93Pb0ujhEv4q83rTFZ73 | currentPeriodStart, currentPeriodEnd, renewalDate, createdAt, updatedAt |

## Recomendação

- [x] Aprovar apply (baseado nos 0 campos inválidos e escopo controlado)
- [ ] Não aprovar apply ainda
- [ ] Ajustar script antes de apply

> [!IMPORTANT]
> O apply deve ser feito com cautela e após aprovação explícita.
