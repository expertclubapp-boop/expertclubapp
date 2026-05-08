# Expert Club — Student V2 Gap Analysis

## Status

Aluno funcional para QA interno controlado, com screenshots dedicados em 390x844 e 430x932.

Visualmente, as rotas principais estao alinhadas ao padrao mobile V2 o bastante para QA interno. Ainda assim, isso nao libera "100% V2" publico nem Beta externo: a validacao visual ampla por viewport e a revisao de produto ainda precisam continuar.

Separar sempre:

- Funcional: rota carrega, le/grava dados reais e nao tem erro operacional.
- Visual V2: rota esta alinhada ao shell mobile, paleta Violeta Eletrico, cards V2, tipografia e espacamento V2.

## Mapa atual

| Rota | Funcional | Visual V2 | Screenshot | Status |
|---|---|---|---|---|
| /app/today | Sim | Sim | `qa/student-v2-parity/student-today-390.png`, `student-today-430.png` | OK para QA interno |
| /app/workouts | Sim | Sim | `qa/student-v2-parity/student-workouts-390.png`, `student-workouts-430.png` | OK para QA interno |
| /app/workouts/:id | Sim | Sim | `qa/student-v2-parity/student-workout-detail-390.png`, `student-workout-detail-430.png` | OK para QA interno |
| /app/workouts/session/:id | Sim | Sim | `qa/student-v2-parity/student-workout-session-390.png`, `student-workout-session-430.png` | OK para QA interno |
| /app/diets | Sim | Sim | `qa/student-v2-parity/student-diets-390.png`, `student-diets-430.png` | OK para QA interno |
| /app/diets/today | Sim | Sim | `qa/student-v2-parity/student-diet-today-390.png`, `student-diet-today-430.png` | OK para QA interno |
| /app/checkin/daily | Sim | Sim | `qa/student-v2-parity/student-checkin-daily-390.png`, `student-checkin-daily-430.png` | OK para QA interno |
| /app/checkin/weekly | Sim | Sim | `qa/student-v2-parity/student-checkin-weekly-390.png`, `student-checkin-weekly-430.png` | OK para QA interno |
| /app/content | Sim | Sim | `qa/student-v2-parity/student-content-390.png`, `student-content-430.png` | OK para QA interno |
| /app/challenges | Sim | Sim | `qa/student-v2-parity/student-challenges-390.png`, `student-challenges-430.png` | OK para QA interno; overflow 390 corrigido |
| /app/profile | Sim | Sim para QA interno | `qa/student-v2-parity/student-profile-390.png`, `student-profile-430.png` | OK para QA interno; manter em observacao de produto |
| /app/billing | Sim | Sim para QA interno | `qa/student-v2-parity/student-billing-390.png`, `student-billing-430.png` | OK para QA interno |

## QA funcional pos-visual

| Fluxo | Resultado |
|---|---|
| /app/today: abrir proximo treino | PASS |
| /app/workouts: abrir treino | PASS |
| /app/workouts/:id: iniciar sessao | PASS |
| /app/workouts/session/:id: registrar serie | PASS |
| /app/diets: abrir dieta | PASS |
| /app/diets/today: renderizar/marcar item se existir | PASS |
| /app/checkin/daily: salvar check-in | PASS |
| /app/checkin/weekly: salvar check-in | PASS |
| /app/content: abrir conteudo | PASS |
| /app/content: marcar progresso | PASS |
| /app/challenges: entrar/ver desafio | PASS |
| /app/profile: salvar alteracao | PASS |
| /app/billing: renderizar sem permission denied | PASS |

## Regra de release

Pode usar "Aluno V2 completo para QA interno" para o escopo acima.

Nao usar:

- "Beta externo"
- "Production Ready"
- "100% V2" em sentido publico/produto completo
- "pronto para usuarios reais sem ressalva"
