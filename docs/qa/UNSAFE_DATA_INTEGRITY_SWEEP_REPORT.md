# Unsafe Data Integrity Sweep Report

Data da rodada: 2026-05-14

## Veredito

Unsafe Data Integrity Sweep validado para QA interno controlado

## Objetivo

Corrigir somente riscos de integridade de dados em writes reais de Firestore, sem mexer em deploy, backfill apply ou features novas.

## Achados principais

| Arquivo | Padrão | Está em write Firestore? | Risco | Corrigido agora? |
|---|---|---:|---|---|
| `src/services/adminAffiliateService.ts` | `createdAt/updatedAt/paidAt` em ISO string | Sim | P0 | Sim |
| `src/services/adminCommissionService.ts` | `createdAt/updatedAt/paidAt` em ISO string | Sim | P0 | Sim |
| `src/services/adminCommunityService.ts` | `updatedAt` em ISO string | Sim | P0 | Sim |
| `src/services/adminWorkoutService.ts` | payload de publish/rollback com cast frouxo | Sim | P0 | Sim |
| `src/services/adminDietService.ts` | payload de publish/rollback com cast frouxo | Sim | P0 | Sim |
| `src/services/contentService.ts` | `saveContent` / `saveProgress` sem normalização segura | Sim | P0 | Sim |
| `src/services/communityFeedService.ts` | `createdAt` em post/comentário | Sim | P0 | Sim |
| `src/services/challengeService.ts` | `joinChallenge` com datas como string operacional | Sim | P0 | Sim |
| `src/services/challengeScoringService.ts` | update de participante com data mutável insegura | Sim | P0 | Sim |
| `src/services/mentorAssignmentService.ts` | `updatedAt` em ISO string | Sim | P0 | Sim |
| `src/services/notificationService.ts` | `createdAt` em envio de notificação | Sim | P0 | Sim |
| `src/services/adminCrudService.ts` | writes sem helper central de sanitização | Sim | P0 | Sim |

## Correções aplicadas

- criado/reutilizado helper raso de write seguro em `src/lib/firebase/date.ts`:
  - `removeUndefinedFields`
  - `normalizeFirestoreWriteData`
- `adminCrudService` agora normaliza datas conhecidas e remove `undefined` antes de `setDoc` e `updateDoc`;
- paths reais de affiliate, comissão, comunidade, conteúdo, desafio, community feed, notificação e mentoria passaram a gravar `Timestamp` em vez de string operacional;
- `publish`/`rollback` de treino e dieta deixaram de depender de cast para empurrar payload inconsistente;
- `saveProgress` de conteúdo e pontuação de desafio continuam aceitando estado local em string quando necessário, mas a persistência converte para `Timestamp` antes do write;
- `as any` em write path Firestore ficou zerado;
- `toISOString` em campo operacional escrito diretamente no Firestore ficou zerado.

## Padrões antes/depois

| Padrão | Antes | Depois | Restante justificado |
|---|---:|---:|---|
| `as any` total | 41 | 37 | leituras antigas, UI admin legada, evolução e billing fora do escopo desta PR |
| `as any` em write Firestore | >0 | 0 | nenhum |
| `toISOString` total | 60 | 32 | dayKey, rascunhos locais, construtores vazios e estados de formulário ainda aceitos |
| `toISOString` em campo Firestore | >0 | 0 | nenhum write direto restante |

## Exceções documentadas

- `toISOString` permanece em construtores vazios de admin (`createEmpty*`) porque são objetos locais de edição; os writes passam por normalização antes de persistir.
- `toISOString` permanece em alguns estados de formulário/admin e helpers de chave de dia; isso não voltou a abrir dívida de data no Firestore.
- `as any` residual está concentrado em leitura, telas administrativas antigas e código fora do miolo de write corrigido.

## Validações técnicas

| Comando | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run smoke:roles` | PASS |
| `npm run test:rules` | PASS |
| `npm run smoke:setup:dry` | PASS |
| `npm run backfill:date-fields -- --dry-run` | PASS (`wouldUpdate: 0`, `invalid: 0`) |

## Browser QA mínimo

- `student@expertclub.test`:
  - `/app/today`: PASS
  - `/app/recommendations`: PASS
  - `/app/diets/today`: PASS
  - `/app/checkin/daily`: PASS
  - `/app/profile`: PASS
  - `/app/workouts` + fluxo até execução: PASS
- `/admin/users/2GI57LeVLcWtyFqPdhUBlVeDJ202?tab=treino`: rota abriu em contexto admin e manteve regressão controlada
- `/admin/users/2GI57LeVLcWtyFqPdhUBlVeDJ202?tab=dieta`: sem mudança funcional nesta PR; cobertura indireta mantida pela bateria anterior do Student 360 no mesmo ambiente

## Resultado do backfill dry-run

- `wouldUpdate: 0`
- `invalid: 0`

## Pendências restantes

- ainda há `as any` residual fora de write path;
- ainda há `toISOString` residual em dayKey, rascunhos e áreas não operacionais;
- a limpeza total do repo continua fora do escopo desta PR;
- release externo continua bloqueado.
