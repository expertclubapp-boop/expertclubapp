# Student Recommendations Report

Data da validação: 2026-05-14

## Veredito permitido

Template Metadata + Recommendation Engine V1 validado para QA interno controlado

## Escopo desta PR

- adicionar metadata de recomendação nos templates de treino e dieta;
- expor metadata editável nos editores admin reais;
- criar `recommendationService` com score explicável;
- transformar `/app/recommendations` em fluxo real de escolha;
- atualizar roteamento do member para recomendações quando faltar plano ou houver refresh pendente;
- permitir que `/app/profile` peça atualização de recomendações.

## Metadata adicionada

### Workout

- `goals`
- `sexes`
- `frequencies`
- `levels`
- `locations`
- `equipmentProfile`
- `tags`

### Diet

- `goals`
- `sexes`
- `preferences`
- `caloriesRange`
- `proteinLevel`
- `complexity`
- `tags`

## Engine V1

Arquivo principal:

- `src/services/recommendationService.ts`

Regras de score implementadas:

- treino:
  - objetivo compatível: `+40`
  - frequência compatível: `+25`
  - nível compatível: `+15`
  - sexo compatível/unissex: `+10`
  - local compatível: `+10`
- dieta:
  - objetivo compatível: `+35`
  - preferência alimentar: `+30`
  - faixa calórica aproximada: `+20`
  - sexo compatível/unissex: `+10`
  - complexidade adequada: `+5`

Saída validada:

- top 3 treinos
- top 3 dietas
- `reasons` explicáveis em PT-BR
- `warnings` honestos quando o encaixe é parcial

## Browser QA

Usuários validados:

- `student2@expertclub.test`
- `admin@expertclub.test`

### Admin

- abriu `/admin/workouts/gluteos-inferiores-4x`
- abriu `/admin/diets/hipertrofia-2700`
- metadata de recomendação apareceu nos dois editores reais

Evidências:

- `qa/student-recommendations/admin-template-metadata-workout.png`
- `qa/student-recommendations/admin-template-metadata-diet.png`

### Aluno

- login com onboarding concluído e sem plano selecionado levou para `/app/recommendations`
- loading motion apareceu antes do carregamento
- cards de treino e dieta apareceram com motivos explicáveis
- escolha de treino atualizou `selectedWorkoutId`
- escolha de dieta atualizou `selectedDietId`
- redirecionamento ocorreu para `/app/today`
- `/app/workouts` refletiu o treino escolhido como `Plano atual`
- `/app/diets/today` refletiu a dieta escolhida
- edição de preferência em `/app/profile` marcou `recommendationsNeedRefresh: true`
- CTA `Ver novos planos` apareceu e levou de volta para `/app/recommendations`

Evidências:

- `qa/student-recommendations/onboarding-completed-to-recommendations.png`
- `qa/student-recommendations/recommendations-loading.png`
- `qa/student-recommendations/recommendations-workout-cards.png`
- `qa/student-recommendations/recommendations-diet-cards.png`
- `qa/student-recommendations/recommendations-selection-confirmed.png`
- `qa/student-recommendations/today-after-plan-selection.png`
- `qa/student-recommendations/profile-refresh-recommendations.png`

## Persistência conferida

- `profiles/{uid}.selectedWorkoutId` atualizado via escolha do aluno
- `profiles/{uid}.selectedDietId` atualizado via escolha do aluno
- `profiles/{uid}.recommendationsNeedRefresh` volta para `false` na seleção
- editar preferências no perfil marca `recommendationsNeedRefresh: true`
- `publishedAt` dos editores admin ativos deixou de usar ISO string nova no fluxo principal desta PR

## Observação importante sobre histórico de seleção

- o service já tenta registrar `users/{uid}/planSelections/{selectionId}`;
- as rules e os testes locais cobrem essa coleção;
- como esta PR não inclui deploy, o fluxo principal do aluno não depende mais desse write para concluir a seleção;
- no ambiente atual, a escolha do plano fica garantida por `profiles.selectedWorkoutId` e `profiles.selectedDietId`;
- `planSelections` fica como trilha auxiliar best-effort até a próxima janela autorizada de deploy de rules.

## Gates

| Comando | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run smoke:roles` | PASS |
| `npm run test:rules` | PASS |
| `npm run smoke:setup:dry` | PASS |
| `npm run backfill:date-fields -- --dry-run` | PASS (`wouldUpdate: 0`, `invalid: 0`) |

## Greps obrigatórios

Resultado desta rodada:

- `alert(`: ocorrências apenas em telas de affiliate fora do escopo desta PR
- `confirm(`: nenhuma ocorrência em `src/screens` e `src/services`
- `href=\"#\"`: nenhuma ocorrência
- `console.log`: nenhuma ocorrência em `src/screens` e `src/services`
- `totalTonnage: null`: nenhuma ocorrência
- `as any`: ainda há dívida residual em telas/serviços legados fora do fluxo principal; os casts diretos nos editores reais de treino/dieta foram reduzidos nesta PR
- `toISOString`: ainda há ocorrências em áreas fora desta frente; no caminho principal desta PR os editores reais de treino/dieta deixaram de gravar `publishedAt` com ISO string nova

## Pendências restantes

- deploy futuro de rules para transformar `planSelections` em trilha remota garantida, sem modo best-effort;
- refinamento visual residual fora do novo dashboard diario low ticket;
- versão seguinte da tela de recomendações com mais contexto de comparação, se necessário.

## Observação após a rodada do dashboard

- `/app/today` deixou de expulsar o aluno automaticamente quando `recommendationsNeedRefresh = true`;
- o refresh agora aparece como alerta e CTA dentro do dashboard, preservando o papel de centro diário do app;
- quando faltam planos, a rota default continua podendo levar para `/app/recommendations`, mas o acesso direto a `/app/today` mostra estado honesto sem loop.

## Veredito

Template Metadata + Recommendation Engine V1 validado para QA interno controlado
