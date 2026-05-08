# Expert Club - Student V2 Visual Parity Report

## Veredito

PASS - aluno mobile visualmente alinhado ao V2 para QA interno controlado.

Este veredito vale somente para QA interno controlado. Nao e Beta externo, nao e Production Ready e nao libera escala.

## Escopo

Rotas auditadas com login real `student@expertclub.test`:

- `/app/today`
- `/app/workouts`
- `/app/workouts/:id`
- `/app/workouts/session/:id`
- `/app/diets`
- `/app/diets/today`
- `/app/checkin/daily`
- `/app/checkin/weekly`
- `/app/content`
- `/app/challenges`
- `/app/profile`
- `/app/billing`

## Problemas encontrados

| Categoria | Antes | Acao |
|---|---|---|
| Shell mobile | Canvas escuro legado e preview desktop com comportamento inconsistente. | Shell do aluno passou a usar a mesma familia light premium do V2 admin/mentor e preview centralizado em 430px. |
| Identidade | Prints anteriores mostravam `Overview`, `Admin` e perfil administrativo na area do aluno. | Prints novos foram capturados com login real de `student@expertclub.test`; `/app/today` e `/app/profile` mostram aluno. |
| Conteudo | Layout parecia outro app, com coluna lateral apertada e cards escuros legados. | Grids responsivos colapsam dentro do canvas mobile; hero, cards e materiais usam superficie V2 clara. |
| Desafios | Tela tinha hero dark isolado, labels espremidos e box lateral apertado. | Hero, missoes, progresso e regras usam cards V2 claros, texto mais legivel e CTA controlado. |
| Dieta do dia | Empty state pobre e hidratacao isolada podia parecer conteudo quebrado. | Empty state explica a ausencia de refeicoes, mantem resumo de macros e CTA real para dietas. |
| Treinos | Cards ainda tinham faixa escura dominante e area vazia. | Fallback visual dos cards usa gradiente claro, icone e metadados legiveis. |
| Sessao de treino | A primeira URL reutilizada nao pertencia ao aluno logado. | Sessao real foi criada pelo fluxo do aluno e recapturada com exercicios/series reais. |
| Badges e tipografia | Uppercase/italic antigo e pills apertadas prejudicavam leitura. | Escopo do aluno reduz italic/tracking legado e reforca padding, contraste e pesos. |
| Acoes falsas | Busca/download em conteudo pareciam ativos sem fluxo. | Busca e downloads sem fluxo ficam disabled com motivo; cards mock nao parecem clicaveis. |

## Componentes e arquivos migrados

| Arquivo | Migracao |
|---|---|
| `src/index.css` | Tokens do aluno migrados para light premium V2, overrides de cards, badges, textos, inputs, bottom nav e desktop preview. |
| `src/components/layout/AppShell.tsx` | Host do aluno deixa de forcar fundo dark legado. |
| `src/components/v2/ExpertClubMobileShell.tsx` | Main do shell passa a usar somente `ec-v2-mobile`, sem background dark hardcoded. |
| `src/components/v2/ExpertClubWorkoutCard.tsx` | Fallback visual dos cards de treino alinhado ao V2 claro. |
| `src/screens/content/ExpertCenterScreen.tsx` | Hero e cards do conteudo ajustados para grid mobile V2; busca/download sem fluxo ficam disabled. |
| `src/screens/checkin/DailyCheckinScreen.tsx` | Standalone visual do check-in alinhado ao V2 do aluno. |
| `src/screens/checkin/WeeklyCheckinScreen.tsx` | Standalone visual do check-in semanal alinhado ao V2 do aluno. |
| `src/screens/workouts/WorkoutExecutionScreen.tsx` | Execucao de treino e empty states passam pelo wrapper V2 standalone. |

## Matriz de screenshots

Pasta: `qa/student-v2-visual-parity/`

| Rota | 390x844 | 430x932 | 1440x900 | Status |
|---|---|---|---|---|
| `/app/today` | `student-today-390.png` | `student-today-430.png` | `student-today-1440.png` | PASS |
| `/app/workouts` | `student-workouts-390.png` | `student-workouts-430.png` | `student-workouts-1440.png` | PASS |
| `/app/workouts/:id` | `student-workout-detail-390.png` | `student-workout-detail-430.png` | `student-workout-detail-1440.png` | PASS |
| `/app/workouts/session/:id` | `student-workout-session-390.png` | `student-workout-session-430.png` | `student-workout-session-1440.png` | PASS |
| `/app/diets` | `student-diets-390.png` | `student-diets-430.png` | `student-diets-1440.png` | PASS |
| `/app/diets/today` | `student-diet-today-390.png` | `student-diet-today-430.png` | `student-diet-today-1440.png` | PASS |
| `/app/checkin/daily` | `student-checkin-daily-390.png` | `student-checkin-daily-430.png` | `student-checkin-daily-1440.png` | PASS |
| `/app/checkin/weekly` | `student-checkin-weekly-390.png` | `student-checkin-weekly-430.png` | `student-checkin-weekly-1440.png` | PASS |
| `/app/content` | `student-content-390.png` | `student-content-430.png` | `student-content-1440.png` | PASS |
| `/app/challenges` | `student-challenges-390.png` | `student-challenges-430.png` | `student-challenges-1440.png` | PASS |
| `/app/profile` | `student-profile-390.png` | `student-profile-430.png` | `student-profile-1440.png` | PASS |
| `/app/billing` | `student-billing-390.png` | `student-billing-430.png` | `student-billing-1440.png` | PASS |

## QA visual

| Check | Resultado |
|---|---|
| Login real de aluno | PASS - `student@expertclub.test` |
| Texto indevido `Admin`/`Overview` no aluno | PASS - nao observado nos screenshots novos |
| Shell mobile ocupa viewport | PASS |
| Desktop preview centralizado | PASS |
| Bottom nav unica e legivel | PASS |
| Conteudo e desafios parecem parte do mesmo sistema visual | PASS |
| Dieta do dia tem empty state honesto | PASS |
| Sessao de treino contem exercicios/series reais | PASS |
| Permission denied / erro de indice | PASS - nao observado na captura automatizada |

## Pendencias remanescentes

| Item | Gravidade | Motivo |
|---|---|---|
| Validar dieta com refeicoes reais | Importante antes de usuario real | A tela esta correta para plano sem refeicoes, mas ainda vale testar uma dieta completa. |
| Actionability global fora do aluno | Medio | Ainda existem `alert()`/`confirm()` herdados em rotas antigas fora do escopo aluno mobile. |
| Backfill apply de datas | Antes de escala | Normalizacao esta preparada, mas limpeza de documentos legados ainda exige aprovacao. |

## Validacao tecnica

Preencher apos a rodada final:

| Comando | Status |
|---|---|
| `npm run typecheck` | PENDENTE |
| `npm run build` | PENDENTE |
| `npm run smoke:roles` | PENDENTE |
| `npm run test:rules` | PENDENTE |
