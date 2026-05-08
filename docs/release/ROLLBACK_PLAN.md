# Expert Club — Rollback Plan

## Cenarios de rollback

- Firestore Rules bloqueando usuarios
- Dashboard admin quebrado
- Login/guards quebrados
- Escrita de check-in/treino/dieta falhando
- Layout mobile inutilizavel

## Hosting oficial

Frontend hospedado na Vercel.

Firebase Hosting nao e o hosting oficial do frontend.

## Antes do deploy

- Registrar commit atual estavel
- Salvar rules atuais
- Confirmar Firebase projectId
- Rodar validacoes obrigatorias
- Confirmar canal de comunicacao de incidentes

## Comandos de validacao

- npm run typecheck
- npm run build
- npm run smoke:roles
- npm run test:rules

Seeds de QA nao devem ser usados como validacao de rollback sem necessidade operacional explicita.

## Rollback de frontend — Vercel

1. Abrir Vercel.
2. Selecionar o projeto `expertclubapp`.
3. Ir em `Deployments`.
4. Identificar o ultimo deploy estavel.
5. Usar `Promote to Production` ou rollback pelo painel da Vercel.
6. Validar:
   - `/login`
   - `/app/today`
   - `/admin/dashboard`
   - `/mentor/overview`
7. Registrar o commit/deploy restaurado.

## Rollback de Firestore Rules

1. Confirmar projectId antes de qualquer comando.
2. Restaurar versao anterior de `firestore.rules`.
3. Rodar `npm run test:rules`.
4. Deployar apenas apos aprovacao:

```bash
firebase deploy --only firestore:rules --project expertcoaching-b91e2
```

5. Validar:
   - login aluno
   - `/app/today`
   - `/admin/dashboard`
   - `/mentor/overview`

Alerta: nao fazer rollback de rules sem confirmar que ainda estamos em ambiente unico de pre-lancamento / QA controlado.

Se houver usuarios reais, pagamento real ou dados reais de clientes, reabrir decisao de ambiente antes de qualquer rollback de rules.

## Responsavel por aprovar rollback

Aprovador: Ruben

Funcao: Owner / responsavel pelo projeto

Data da definicao: 2026-05-07

Rollback so pode ser aprovado pelo Owner ou responsavel tecnico designado.

## Checklist antes de rollback

- [ ] Incidente classificado
- [ ] Commit/deploy estavel identificado
- [ ] ProjectId Firebase confirmado
- [ ] Impacto em Auth/Firestore/Rules avaliado
- [ ] Aprovacao registrada
- [ ] Rollback executado
- [ ] Smoke pos-rollback realizado
- [ ] Resultado documentado

## Status do rollback

| Item | Status |
|---|---|
| Hosting oficial | Resolvido: Vercel |
| Caminho de rollback frontend | Resolvido para QA interno controlado |
| Aprovador de rollback | Resolvido: Ruben |
| Rollback de Firestore Rules | Documentado com confirmacao de projectId, `test:rules` e deploy controlado |

## Limite deste gate

Rollback operacional fechado para QA interno controlado.

Nao e Beta externo.
Nao e Production Ready.
Nao e pronto para escala.
