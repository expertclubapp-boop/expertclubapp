# Expert Club — Auditoria Pós-Hardening

## Data

2026-05-09

## Contexto

Auditoria realizada após o hardening de segurança e UI/UX para validar se o status anterior de "QA interno controlado" era preciso.

## Status real encontrado

- QA interno controlado mantido.
- Release externo bloqueado.
- Não é Beta externo.
- Não é Production Ready.
- Não é pronto para escala.

## P0 encontrados

### P0-1: AppRoute não bloqueava affiliate de acessar `/app/*`

| Item | Detalhe |
|---|---|
| Arquivo | `src/router/AppRoute.tsx` |
| Problema | `AppRoute` aplicava subscription gate apenas para `role === 'member'`. Affiliate com onboarding completo podia abrir `/app/today`, `/app/workouts`, `/app/diets`, `/app/diets/today`. Firestore Rules bloqueavam dados, mas o frontend deixava a pessoa cair numa experiência quebrada com permission errors. |
| Correção | Affiliate agora é redirecionado para `/affiliate/dashboard` antes de qualquer verificação de subscription. Mentor também é redirecionado para `/mentor/overview` se tentar acessar `/app/*`. |
| Validação | `npm run smoke:roles` inclui caso de affiliate com assinatura ativa que ainda vai para `/affiliate/dashboard`. Source-level guard verifica presença do check no `AppRoute.tsx`. |
| Status | **Corrigido** |

### P0-2: Substituição alimentar mock em `/app/diets/today`

| Item | Detalhe |
|---|---|
| Arquivo | `src/screens/diets/DietDayScreen.tsx` |
| Problema | Modal de substituição usava opções hardcoded (`Opção A (Equivalente)`, `Opção B (Equivalente)`) e casting `as any` para forçar payload incompleto como `Food`. Isso podia gravar `foodId: undefined`, `macros: undefined` no Firestore. |
| Correção | Modal agora mostra empty state honesto explicando que alternativas aprovadas não foram cadastradas pelo mentor. Nenhuma ação de escrita é possível. `substituteFood` removida do destructuring. Tipo do `substitutionTarget` corrigido (não usa mais `any`). |
| Validação | `grep` não encontra mais `Opção A/B` em `src/`. Nenhum `} as any)` nem chamada a `substituteFood(` existe em `DietDayScreen`. `npm run typecheck` e `npm run build` passam. |
| Status | **Corrigido** |

## Smoke tests atualizados

| Teste | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run smoke:roles` | PASS |
| `npm run smoke:setup:dry` | PASS |

Novos cenários adicionados em `scripts/roleRedirectSmoke.ts`:

- Affiliate com assinatura `pending` → `/affiliate/dashboard`
- Affiliate com assinatura `active` → `/affiliate/dashboard` (não é aluno)
- Source-level guard: `AppRoute.tsx` contém check de `role === 'affiliate'`
- Source-level guard: `DietDayScreen.tsx` não contém `Opção A/B` nem `substituteFood(`

## Pendências que NÃO foram tocadas

| Pendência | Motivo |
|---|---|
| CommunityScreen `alert()` / `confirm()` / `href="#"` | Corrigido em 2026-05-10 |
| Admin catalog `alert()` / `confirm()` (diets, workouts, exercises, foods) | Corrigido em 2026-05-10 |
| `mentorDashboardService` limits | Corrigido em 2026-05-10 |
| `bodyCheckins` index deploy/validation | Corrigido em 2026-05-10 |
| Backfill apply de datas | Concluído em 2026-05-10 |
| Polish visual | Escopo separado |
| Feature nova | Escopo separado |

## Veredito

**P0 flow integrity e UI Actionability (Student + Admin Catalog) validados para QA interno controlado.**

Actionability global das rotas principais admin/mentor/student agora está **HARDENED**.
Release externo continua bloqueado sem discussão.

## Atualização: CommunityScreen Actionability Cleanup (2026-05-10)

| Item | Detalhe |
|---|---|
| Arquivo | `src/screens/community/CommunityScreen.tsx` |
| Problema | Presença de `alert()`, `window.confirm()`, `href="#"` e CTAs sem funcionalidade real (WhatsApp/Suporte). |
| Correção | Removidos UX nativos; implementada confirmação inline e Toasts. Botões agora consomem `communityService.getSettings()`. |
| Validação | `grep` não encontra mais `alert(`, `confirm(` ou `href="#"` no arquivo. |
| Validação | `grep` não encontra mais `alert(` ou `window.confirm(` no diretório `src/screens/admin/`. `npm run typecheck` e `npm run build` passam. |
| Status | **Corrigido** |

### Atualização: MentorDashboardService Limits + Recortes (2026-05-10)

| Item | Detalhe |
|---|---|
| Arquivo | `src/services/mentorDashboardService.ts` |
| Problema | Riscos de escala: leituras globais ilimitadas no contexto admin e waterfall de subcoleções por aluno sem limites. |
| Correção | Implementados limites rigorosos (`MAX_STUDENTS: 100`, `MAX_ADMIN_USERS: 500`, etc.), `orderBy` temporal e aviso de recorte na UI. |
| Validação | `npm run typecheck`, `npm run build` e suíte de smoke/rules passaram. Isolamento por mentor preservado. |
| Status | **Corrigido** |

### Atualização: Admin Catalog Native UX Cleanup (2026-05-10)

| Item | Detalhe |
|---|---|
| Arquivos | `src/screens/admin/Admin{Diet,Workout,Exercise,Food}{Editor,}Screen.tsx` |
| Problema | 21 ocorrências de `alert()` e 4 de `window.confirm()` em catálogos e editores. |
| Correção | Substituído UX nativo por `ConfirmButton` (inline) para duplicação/arquivamento e `toastError` para erros de validação e service. |
| Validação | `grep` não encontra mais `alert(` ou `window.confirm(` no diretório `src/screens/admin/`. `npm run typecheck` e `npm run build` passam. |
| Status | **Corrigido** |

### Atualização: Backfill Date Fields Prep (2026-05-10)

| Item | Detalhe |
|---|---|
| Arquivo | `scripts/backfillDateFields.mjs` |
| Problema | Documentos legados com ISO strings incompatíveis com queries por Timestamp em escala. |
| Correção | Script auditado com guardrails (`--confirm-apply`, `--confirm-qa-project`). Dry-run fresco executado (41 documentos seriam atualizados). |
| Documentação | `BACKFILL_DATE_FIELDS_REVIEW.md` e `BACKFILL_DATE_FIELDS_APPLY_CHECKLIST.md` criados. |
| Status | **Preparado para apply controlado** |

### Atualização: Backfill Date Fields Apply (2026-05-10)

| Item | Detalhe |
|---|---|
| Ação | Execução do backfill de datas com `--apply --confirm-apply --confirm-qa-project`. |
| Resultado | 41 documentos convertidos de ISO string para Firestore Timestamp em `expertcoaching-b91e2`. |
| Validação | Dry-run pós-apply retornou 0 documentos pendentes. Testes (typecheck, build, smoke, rules) passaram. Browser: `/admin/dashboard`, `/app/workouts/session`, `/app/diets/today` e `/app/checkin/daily` abertos com sucesso. |
| Status | **Concluído** |

### Atualização: Validação de Dieta Real do Aluno (2026-05-10)

| Item | Detalhe |
|---|---|
| Ação | Ajuste do seed `qa-diet` para conter 4 refeições com alimentos reais (Ovos, Frango, Whey, etc.) e macros coerentes, além da simulação de progresso via Firestore. |
| Resultado | `/app/diets/today` renderizou a dieta real. Documentos salvos no Firestore contêm Timestamp correto, arrays de itens e macros calculados sem `undefined` ou payloads inválidos. |
| Validação | Schema de `DietDay` validado na leitura e escrita. Progresso atualiza de 0% para a porcentagem calculada após marcação. Telas `/app/today` e `/app/diets` refletem a dieta real com as calorias totais. |
| Status | **Concluído para QA Interno** |
