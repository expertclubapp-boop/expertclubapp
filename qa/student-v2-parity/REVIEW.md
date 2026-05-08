# Expert Club — Student V2 Screenshot Review

## Escopo

Screenshots revisados em `390x844` e `430x932` para as rotas do aluno liberadas ao QA interno.

## Resultado

| Rota | 390x844 | 430x932 | Overflow? | Visual V2? | CTA visivel? | Status |
|---|---|---|---|---|---|---|
| /app/today | `student-today-390.png` | `student-today-430.png` | Nao | Sim | Sim | PASS |
| /app/workouts | `student-workouts-390.png` | `student-workouts-430.png` | Nao | Sim | Sim | PASS |
| /app/workouts/:id | `student-workout-detail-390.png` | `student-workout-detail-430.png` | Nao | Sim | Sim | PASS |
| /app/workouts/session/:id | `student-workout-session-390.png` | `student-workout-session-430.png` | Nao | Sim | Sim | PASS |
| /app/diets | `student-diets-390.png` | `student-diets-430.png` | Nao | Sim | Sim | PASS |
| /app/diets/today | `student-diet-today-390.png` | `student-diet-today-430.png` | Nao | Sim | Sim | PASS |
| /app/checkin/daily | `student-checkin-daily-390.png` | `student-checkin-daily-430.png` | Nao | Sim | Sim | PASS |
| /app/checkin/weekly | `student-checkin-weekly-390.png` | `student-checkin-weekly-430.png` | Nao | Sim | Sim | PASS |
| /app/content | `student-content-390.png` | `student-content-430.png` | Nao | Sim | Sim | PASS |
| /app/challenges | `student-challenges-390.png` | `student-challenges-430.png` | Corrigido | Sim | Sim | PASS |
| /app/profile | `student-profile-390.png` | `student-profile-430.png` | Nao | Sim para QA interno | Sim | PASS |
| /app/billing | `student-billing-390.png` | `student-billing-430.png` | Nao | Sim para QA interno | Sim | PASS |

## Observacoes

- A primeira captura de `student-checkin-weekly-430.png` pegou loading; foi recapturada e substituida por screenshot carregada.
- `/app/challenges` tinha overflow horizontal no segmented control em 390px; corrigido e recapturado.
- Nenhuma rota revisada mostra tela de login, permission denied ou erro operacional.
