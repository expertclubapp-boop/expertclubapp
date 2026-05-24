# Legacy Debt Sweep Report

Data da rodada: 2026-05-14

## Veredito permitido

Parcial: dívida legada ainda afeta rotas reais

## Escopo desta rodada

- remover `alert()` das telas de affiliate;
- remover `console.log` do bundle real;
- reduzir casts perigosos em writes de check-in e dieta;
- impedir reabertura de ISO string em campos de data dos fluxos de check-in/dieta;
- corrigir legibilidade crítica nas telas centrais do aluno;
- revalidar student routes e Admin Student 360 sem regressão.

## Correções entregues

Arquivos principais:

- `src/screens/affiliate/AffiliateDashboardScreen.tsx`
- `src/screens/affiliate/AffiliatePortalScreen.tsx`
- `src/utils/referral.ts`
- `src/services/checkinService.ts`
- `src/services/dietDayService.ts`
- `src/screens/checkin/DailyCheckinScreen.tsx`
- `src/screens/checkin/WeeklyCheckinScreen.tsx`
- `src/hooks/useDietDay.ts`
- `src/hooks/useHydrationToday.ts`
- `src/hooks/useProgress.ts`
- `src/components/layout/MobileBottomNav.tsx`
- `src/components/layout/PageHeader.tsx`
- `src/screens/workouts/WorkoutsLibraryScreen.tsx`
- `src/screens/workouts/WorkoutDetailScreen.tsx`
- `src/screens/workouts/WorkoutExecutionScreen.tsx`
- `src/screens/diets/DietDayScreen.tsx`
- `src/screens/diets/DietDetailScreen.tsx`
- `src/screens/diets/DietsLibraryScreen.tsx`
- `src/screens/profile/ProfileSettingsScreen.tsx`
- `src/screens/recommendations/RecommendationsScreen.tsx`
- `src/components/v2/ExpertClubWorkoutCard.tsx`
- `src/components/v2/ExpertClubDietCard.tsx`
- `src/types/domain.ts`

## Tabela de padrões

| Padrão | Antes | Depois | Restante documentado |
|---|---:|---:|---|
| `alert()` | 2 | 0 | nenhuma ocorrência em `src` |
| `window.alert` | 0 | 0 | nenhuma ocorrência |
| `confirm()` | 0 | 0 | nenhuma ocorrência |
| `window.confirm` | 0 | 0 | nenhuma ocorrência |
| `href="#"` | 0 | 0 | nenhuma ocorrência |
| `console.log` | 1 | 0 | nenhuma ocorrência em `src` |
| `as any` | múltiplas | 41 | dívida legada residual em admin/evolution/billing e utilitários antigos |
| `toISOString` | múltiplas | 60 | day keys legítimos e writes legados fora do escopo principal ainda pendentes |
| `text-[10px]` | múltiplas | 323 no repo / 0 nas rotas críticas | dívida visual residual em telas secundárias/admin |

## Classificação objetiva

| Padrão | Arquivo | Rota/área | É rota real? | Risco | Decisão |
|---|---|---|---|---|---|
| `alert()` | `src/screens/affiliate/AffiliateDashboardScreen.tsx` | `/affiliate/dashboard` | sim | P1 | substituído por `toastSuccess` |
| `alert()` | `src/screens/affiliate/AffiliatePortalScreen.tsx` | `/affiliate/:code` | sim | P1 | substituído por `toastSuccess` |
| `console.log` | `src/utils/referral.ts` | captura de referral | sim | P2 | removido |
| `as any` em write | `src/services/checkinService.ts` | check-ins | sim | P0 | removido do write path |
| `as any` em write | `src/services/dietDayService.ts` | dieta diária | sim | P0 | removido do write path |
| `toISOString` em payload | `src/screens/checkin/DailyCheckinScreen.tsx` | check-in diário | sim | P0 | removido do payload Firestore |
| `toISOString` em payload | `src/screens/checkin/WeeklyCheckinScreen.tsx` | check-in semanal | sim | P0 | removido do payload Firestore |
| `text-[10px]`/baixo contraste | rotas centrais do aluno | `/app/today`, `/app/workouts`, `/app/workouts/:id`, `/app/workouts/session/:id`, `/app/diets/today`, `/app/recommendations`, `/app/profile` | sim | P1 | corrigido no escopo crítico |

## Student Visual Legibility Hotfix

Status:

Student Visual Legibility Hotfix validado para QA interno controlado

O que validou:

- títulos principais em cards dark ficaram legíveis;
- métricas e números ganharam contraste alto;
- badges críticos receberam padding e tipografia maior;
- `text-[10px]`, `text-[9px]` e `text-[8px]` saíram das rotas críticas do aluno;
- bottom nav e header do aluno ficaram mais coerentes com o tema;
- estados vazios e CTAs principais permanecem claros em 390x844.

Rotas auditadas no hotfix:

- `/app/today`
- `/app/workouts`
- `/app/workouts/:id`
- `/app/workouts/session/:id`
- `/app/diets/today`
- `/app/recommendations`
- `/app/profile`

## Browser QA

### Aluno

Validação real com sessão autenticada:

- `/app/today`: PASS
- `/app/workouts`: PASS
- `/app/workouts/session/:id`: PASS
- `/app/diets/today`: PASS
- `/app/recommendations`: PASS

Checagens feitas:

- títulos, subtítulos, métricas, badges e CTAs visíveis sem esforço;
- nenhum número principal apagado;
- sem `alert()`, `confirm()`, `href="#"` ou `console.log` no fluxo;
- console sem erro operacional nas telas capturadas;
- bottom nav coerente visualmente com o tema.

### Admin

- `/admin/users/:id?tab=treino`: PASS
- Admin Student 360 permaneceu funcional após o hotfix de UI do aluno.

### Affiliate

- `/affiliate/MARI384`: PASS no browser para página pública, sem dead link visível e sem alerta nativo.
- `/affiliate/dashboard`: validação funcional de UI ficou **pendente no browser** porque o usuário `influencer@expertclub.com` existe na base, mas a autenticação por credencial reutilizável não estava disponível nesta rodada sem mutação adicional de conta. Mesmo assim, o código da rota foi corrigido e o guard de role segue PASS em `smoke:roles`.

## Evidências

- `qa/student-visual-legibility-hotfix/student-today-legibility-fixed-390.png`
- `qa/student-visual-legibility-hotfix/student-workouts-legibility-fixed-390.png`
- `qa/student-visual-legibility-hotfix/student-workout-session-legibility-fixed-390.png`
- `qa/student-visual-legibility-hotfix/student-diet-legibility-fixed-390.png`
- `qa/student-visual-legibility-hotfix/student-recommendations-legibility-fixed-390.png`
- `qa/legacy-debt-sweep/affiliate-public-page-no-dead-links.png`
- `qa/legacy-debt-sweep/student-today-legibility-check-390.png`
- `qa/legacy-debt-sweep/student-workout-session-legibility-check-390.png`
- `qa/legacy-debt-sweep/student-diet-today-legibility-check-390.png`
- `qa/legacy-debt-sweep/student-recommendations-legibility-check-390.png`
- `qa/legacy-debt-sweep/admin-student-360-regression-check.png`

## Gates

| Comando | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run smoke:roles` | PASS |
| `npm run test:rules` | PASS |
| `npm run smoke:setup:dry` | PASS |
| `npm run backfill:date-fields -- --dry-run` | PASS (`wouldUpdate: 0`, `invalid: 0`) |

## Pendências reais

- ainda há `as any` em áreas legadas fora do miolo crítico, inclusive telas e services administrativos;
- ainda há `toISOString` em flows antigos fora do hotfix, inclusive services administrativos, conteúdo, comunidade e afiliados;
- ainda existem `text-[10px]` em partes secundárias e administrativas do app;
- faltou uma validação browser autenticada do `/affiliate/dashboard` sem recorrer a mutação de credencial.

## Veredito

Parcial: dívida legada ainda afeta rotas reais
