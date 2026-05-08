# Expert Club - Student Mobile Recovery Report

## Veredito

Student mobile recovery validado para QA interno controlado.

Atualizacao 2026-05-08: a camada visual do aluno foi migrada para a mesma familia V2 light premium usada no mentor/admin. O shell mobile, a base visual e o fluxo central de treino foram recuperados e validados com sessao real criada pelo proprio app. Esta validacao nao libera Beta externo, Production Ready ou escala.

Nao e Beta externo.
Nao e Production Ready.
Nao e pronto para escala.

## Correcoes aplicadas

| Area | Antes | Depois |
|---|---|---|
| Shell mobile | App renderizava como coluna estreita colada no canto esquerdo do desktop. | Shell do aluno ocupa 100% do viewport mobile e centraliza um canvas de 430px em desktop preview. |
| Navegacao | Bottom nav duplicada/inconsistente entre `AppShell` e `ExpertClubMobileShell`. | `AppShell` controla a bottom nav do aluno; `ExpertClubMobileShell` nao duplica a nav. |
| Identidade do aluno | `/app/today` mostrava `Overview`, `Admin` e dados herdados de admin/mock. | `/app/today` mostra `Hoje`, saudacao de aluno e fallback seguro para `Aluno`. |
| Visual mobile | Light lavado e dark V1 misturados. | Tokens light premium V2 para o aluno mobile, com surfaces, borders, texto e nav consistentes com admin/mentor. |
| Cards vazios | Treinos tinham area visual grande sem conteudo util quando nao havia thumbnail. | Cards de treino ficaram mais compactos e mostram icone/metadata sem vazio dominante. |
| Diet day | Marcacao de refeicao lia `consumed`, mas o service grava `completed`. | Tela considera `completed` e legado `consumed`. |
| Dieta sem refeicoes | `/app/diets/today` podia parecer vazia/pobre quando o plano nao tinha refeicoes. | Empty state honesto informa que a dieta tem macros, mas ainda nao possui refeicoes configuradas. |
| Check-in diario | Console podia mostrar erro de indice em `workoutSessions.startedAt`. | Indices foram publicados e `getRecentSessions` ganhou fallback local somente para erro de indice em propagacao. |
| Sessao inexistente | `/app/workouts/session/:id` renderizava texto cru fora do padrao PWA. | Empty state dark com CTA real para voltar a treinos. |
| Sessao real de treino | Nao havia prova de registro/conclusao em browser. | Sessao real iniciada pelo fluxo `/app/workouts/:id`, serie registrada, navegacao entre exercicios validada e treino concluido sem erro de console. |
| Conteudo | Busca parecia ativa sem fluxo real. | Busca desabilitada com motivo; comunidade navega explicitamente para rota real. |
| Desafios | Entrar no desafio usava reload e compartilhamento de ranking parecia ativo sem fluxo. | Entrar no desafio usa feedback inline; compartilhar ranking fica disabled com motivo. |

## Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `src/components/layout/AppShell.tsx` | Shell especifico do aluno, bottom nav unica, canvas mobile centralizado em desktop. |
| `src/components/v2/ExpertClubMobileShell.tsx` | Remocao da bottom nav duplicada e links `/app/*` corretos. |
| `src/index.css` | Tokens e overrides de recuperacao mobile dark premium. |
| `src/screens/today/TodayScreen.tsx` | Conteudo real/operacional para `Hoje`; remocao de `Overview`/`Admin` herdados. |
| `src/components/v2/ExpertClubWorkoutCard.tsx` | Card de treino mais denso e sem area vazia dominante. |
| `src/screens/diets/DietDayScreen.tsx` | Compatibilidade `completed`/`consumed` em refeicoes. |
| `src/screens/workouts/WorkoutDetailScreen.tsx` | CTA flutuante reposicionado acima da bottom nav para nao ser interceptado no mobile. |
| `src/screens/workouts/WorkoutExecutionScreen.tsx` | Empty state PWA para sessao/exercicio nao encontrado e correcao de PRs sem `undefined` no payload Firestore. |
| `src/screens/content/ExpertCenterScreen.tsx` | Busca desabilitada com motivo e copy de comunidade mais explicita. |
| `src/screens/challenges/ChallengesScreen.tsx` | Feedback inline para participar e acao de ranking sem fluxo desabilitada. |
| `src/services/workoutSessionService.ts` | Fallback local apenas para erro de indice em `getRecentSessions`. |
| `firestore.indexes.json` | Indices single-field de `workoutSessions.startedAt` para collection e collection group. |

## Screenshots

| Rota | Viewport | Screenshot | Shell correto? | Visual consistente? | CTA principal funciona? | Status |
|---|---:|---|---|---|---|---|
| `/app/today` | 390x844 | `qa/student-mobile-recovery/student-today-390.png` | Sim | Sim | Sim | PASS |
| `/app/workouts` | 390x844 | `qa/student-mobile-recovery/student-workouts-390.png` | Sim | Sim | Sim | PASS |
| `/app/workouts/:id` | 390x844 | `qa/student-mobile-recovery/student-workout-detail-390.png` | Sim | Sim | Sim | PASS |
| `/app/workouts/session/:id` | 390x844 | `qa/student-mobile-recovery/student-workout-session-390.png` | Parcial | Sim | Voltar funciona | PENDENTE |
| `/app/workouts/session/:id` | 390x844 | `qa/student-mobile-recovery/student-workout-session-real-390-pass2.png` | Sim | Sim | Registrar serie validado | PASS |
| `/app/diets` | 390x844 | `qa/student-mobile-recovery/student-diets-390.png` | Sim | Sim | Sim | PASS |
| `/app/diets/today` | 390x844 | `qa/student-mobile-recovery/student-diet-today-390.png` | Sim | Parcial | Hidratacao funciona | ATENCAO |
| `/app/diets/today` | 390x844 | `qa/student-mobile-recovery/student-diet-today-390-pass2.png` | Sim | Sim | Empty state/CTA honesto | PASS |
| `/app/checkin/daily` | 390x844 | `qa/student-mobile-recovery/student-checkin-daily-390.png` | Sim | Sim | Sim | PASS |
| `/app/checkin/weekly` | 390x844 | `qa/student-mobile-recovery/student-checkin-weekly-390.png` | Sim | Sim | Sim | PASS |
| `/app/content` | 390x844 | `qa/student-mobile-recovery/student-content-390.png` | Sim | Parcial | Acoes visiveis controladas | ATENCAO |
| `/app/challenges` | 390x844 | `qa/student-mobile-recovery/student-challenges-390.png` | Sim | Parcial | CTA visivel | ATENCAO |
| `/app/content` | 390x844 | `qa/student-mobile-recovery/student-content-390-pass2.png` | Sim | Sim | Busca disabled com motivo | PASS |
| `/app/challenges` | 390x844 | `qa/student-mobile-recovery/student-challenges-390-pass2.png` | Sim | Sim | Participar com feedback inline | PASS |
| `/app/profile` | 390x844 | `qa/student-mobile-recovery/student-profile-390.png` | Sim | Sim | Sim | PASS |
| `/app/billing` | 390x844 | `qa/student-mobile-recovery/student-billing-390.png` | Sim | Sim | Sim | PASS |
| `/app/today` | 430x932 | `qa/student-mobile-recovery/student-today-430.png` | Sim | Sim | Sim | PASS |
| `/app/workouts` | 430x932 | `qa/student-mobile-recovery/student-workouts-430.png` | Sim | Sim | Sim | PASS |
| `/app/workouts/:id` | 430x932 | `qa/student-mobile-recovery/student-workout-detail-430.png` | Sim | Sim | Sim | PASS |
| `/app/workouts/session/:id` | 430x932 | `qa/student-mobile-recovery/student-workout-session-430.png` | Parcial | Sim | Voltar funciona | PENDENTE |
| `/app/workouts/session/:id` | 430x932 | `qa/student-mobile-recovery/student-workout-session-real-430-pass2.png` | Sim | Sim | Registrar serie validado | PASS |
| `/app/diets` | 430x932 | `qa/student-mobile-recovery/student-diets-430.png` | Sim | Sim | Sim | PASS |
| `/app/diets/today` | 430x932 | `qa/student-mobile-recovery/student-diet-today-430.png` | Sim | Parcial | Hidratacao funciona | ATENCAO |
| `/app/diets/today` | 430x932 | `qa/student-mobile-recovery/student-diet-today-430-pass2.png` | Sim | Sim | Empty state/CTA honesto | PASS |
| `/app/checkin/daily` | 430x932 | `qa/student-mobile-recovery/student-checkin-daily-430.png` | Sim | Sim | Sim | PASS |
| `/app/checkin/weekly` | 430x932 | `qa/student-mobile-recovery/student-checkin-weekly-430.png` | Sim | Sim | Sim | PASS |
| `/app/content` | 430x932 | `qa/student-mobile-recovery/student-content-430.png` | Sim | Parcial | Acoes visiveis controladas | ATENCAO |
| `/app/challenges` | 430x932 | `qa/student-mobile-recovery/student-challenges-430.png` | Sim | Parcial | CTA visivel | ATENCAO |
| `/app/content` | 430x932 | `qa/student-mobile-recovery/student-content-430-pass2.png` | Sim | Sim | Busca disabled com motivo | PASS |
| `/app/challenges` | 430x932 | `qa/student-mobile-recovery/student-challenges-430-pass2.png` | Sim | Sim | Participar com feedback inline | PASS |
| `/app/profile` | 430x932 | `qa/student-mobile-recovery/student-profile-430.png` | Sim | Sim | Sim | PASS |
| `/app/billing` | 430x932 | `qa/student-mobile-recovery/student-billing-430.png` | Sim | Sim | Sim | PASS |
| Todas as rotas do aluno | 390/430/1440 | `qa/student-v2-visual-parity/` | Sim | Sim | Sim | PASS |
| `/app/today` | 1440x900 | `qa/student-mobile-recovery/student-today-1440.png` | Sim, centralizado | Sim | Sim | PASS |
| `/app/today` | 1440x900 | `qa/student-mobile-recovery/student-today-1440-pass2.png` | Sim, centralizado | Sim | Sim | PASS |
| `/app/workouts` | 1440x900 | `qa/student-mobile-recovery/student-workouts-1440.png` | Sim, centralizado | Sim | Sim | PASS |
| `/app/workouts` | 1440x900 | `qa/student-mobile-recovery/student-workouts-1440-pass2.png` | Sim, centralizado | Sim | Sim | PASS |
| `/app/diets/today` | 1440x900 | `qa/student-mobile-recovery/student-diet-today-1440.png` | Sim, centralizado | Parcial | Sim | ATENCAO |
| `/app/diets/today` | 1440x900 | `qa/student-mobile-recovery/student-diet-today-1440-pass2.png` | Sim, centralizado | Sim | Sim | PASS |
| `/app/content` | 1440x900 | `qa/student-mobile-recovery/student-content-1440.png` | Sim, centralizado | Parcial | Acoes visiveis controladas | ATENCAO |
| `/app/challenges` | 1440x900 | `qa/student-mobile-recovery/student-challenges-1440.png` | Sim, centralizado | Parcial | CTA visivel | ATENCAO |
| `/app/content` | 1440x900 | `qa/student-mobile-recovery/student-content-1440-pass2.png` | Sim, centralizado | Sim | Acoes controladas | PASS |
| `/app/challenges` | 1440x900 | `qa/student-mobile-recovery/student-challenges-1440-pass2.png` | Sim, centralizado | Sim | CTA/estado validado | PASS |

## Fluxo de treino real

| Etapa | Resultado |
|---|---|
| Selecionar treino `iniciante-full-body` | PASS |
| Iniciar sessao real pelo CTA | PASS |
| Renderizar 3 exercicios | PASS |
| Registrar primeira serie com reps/carga | PASS |
| Avancar entre exercicios | PASS |
| Concluir treino | PASS |
| Console apos conclusao | Sem erros |

## Validacao

| Comando | Status |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run smoke:roles` | PASS |
| `npm run test:rules` | PASS |
| `npm run smoke:setup:dry` | PASS |

## Pendencias

| Item | Gravidade | Motivo |
|---|---|---|
| Dieta completa com refeicoes reais | Importante | Empty state esta correto quando nao ha refeicoes; ainda vale validar um plano com refeicoes reais antes de usuarios reais. |
| Conteudo e desafios em profundidade editorial | Melhoria futura | Passaram no recorte mobile/PWA, mas ainda podem receber refinamento visual dedicado fora deste gate. |
