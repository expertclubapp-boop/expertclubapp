# Expert Club — Backfill Date Fields Apply Checklist

## Pré-condições

- [x] Projeto ainda está em pré-lançamento / QA controlado
- [x] Não há usuários reais
- [x] Não há pagamentos reais
- [x] Não há dados reais de clientes
- [x] Decision record de ambiente continua válido
- [x] Dry-run fresco executado
- [x] Lista de documentos afetados revisada
- [x] Campos inválidos = 0
- [x] Backup/snapshot lógico realizado ou export documentado
- [x] Ruben aprovou explicitamente o apply

## Comando permitido somente após aprovação

```bash
npm run backfill:date-fields -- --apply --confirm-apply --confirm-qa-project
```

## Validação pós-apply

- [x] Rodar dry-run novamente e confirmar 0 documentos pendentes
- [x] Abrir `/admin/dashboard`
- [x] Abrir `/admin/metrics`
- [x] Abrir `/app/workouts/session/:id`
- [x] Abrir `/app/diets/today`
- [x] Rodar `npm run typecheck`
- [x] Rodar `npm run build`
- [x] Rodar `npm run smoke:roles`
- [x] Rodar `npm run test:rules`
- [x] Rodar `npm run smoke:setup:dry`

## Rollback

- Como o backfill altera dados, rollback não é automático.
- Manter relatório dos valores antigos (snapshot lógico).
- Se necessário, criar script reverso a partir do snapshot lógico.
