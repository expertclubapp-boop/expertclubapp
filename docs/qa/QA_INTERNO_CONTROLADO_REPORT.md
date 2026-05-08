# Expert Club — QA Interno Controlado

## Veredito

Aluno V2 completo para QA interno.

Nao e Beta externo.
Nao e Production Ready.
Nao e liberacao publica sem ressalvas.

## Validações

| Comando | Status |
|---|---|
| npm run qa:seed-users | PASS |
| npm run typecheck | PASS |
| npm run build | PASS |
| npm run smoke:roles | PASS |
| npm run test:rules | PASS |

## Ambiente Firebase

| Ambiente | Project ID | Uso | Status |
|---|---|---|---|
| pre-launch/QA | expertcoaching-b91e2 | QA interno, Vercel Production tecnica pre-lancamento, seeds/smoke/rules controlados | Confirmado pelo owner enquanto nao houver usuarios reais |
| staging/QA separado | Nao criado | Futuro ambiente de QA apos entrada de usuarios reais | Pendente |
| production real | Nao formalizado | Ambiente para usuarios reais apos lancamento | Pendente |

## Browser QA

| Rota | Usuario | Status |
|---|---|---|
| /admin/dashboard | admin@expertclub.test | PASS |
| /admin/users | admin@expertclub.test | PASS |
| /admin/users/:id | admin@expertclub.test | PASS |
| /admin/subscriptions | admin@expertclub.test | PASS |
| /admin/affiliates | admin@expertclub.test | PASS |
| /admin/content | admin@expertclub.test | PASS |
| /admin/financeiro | admin@expertclub.test | PASS |
| /admin/workspaces | admin@expertclub.test | PASS |
| /admin/support | admin@expertclub.test | PASS |
| /mentor/overview | mentor@expertclub.test | PASS |
| /mentor/alunos | mentor@expertclub.test | PASS; student2 nao visivel |
| /mentor/checkins | mentor@expertclub.test | PASS |
| /mentor/financeiro | mentor@expertclub.test | PASS |
| /mentor/influencers | mentor@expertclub.test | PASS |
| /mentor/treinos/prescritor | mentor@expertclub.test | PASS |
| /mentor/dietas/prescritor | mentor@expertclub.test | PASS |
| /app/today | student@expertclub.test | PASS |
| /app/workouts | student@expertclub.test | PASS |
| /app/workouts/:id | student@expertclub.test | PASS |
| /app/workouts/session/:id | student@expertclub.test | PASS |
| /app/diets | student@expertclub.test | PASS |
| /app/diets/today | student@expertclub.test | PASS |
| /app/checkin/daily | student@expertclub.test | PASS |
| /app/checkin/weekly | student@expertclub.test | PASS |
| /app/content | student@expertclub.test | PASS |
| /app/challenges | student@expertclub.test | PASS |
| /app/profile | student@expertclub.test | PASS |
| /app/billing | student@expertclub.test | PASS |

## Student V2 screenshots

Pasta: `qa/student-v2-parity/`

| Rota | Viewports | Status |
|---|---|---|
| /app/today | 390x844, 430x932 | PASS |
| /app/workouts | 390x844, 430x932 | PASS |
| /app/workouts/:id | 390x844, 430x932 | PASS |
| /app/workouts/session/:id | 390x844, 430x932 | PASS |
| /app/diets | 390x844, 430x932 | PASS |
| /app/diets/today | 390x844, 430x932 | PASS |
| /app/checkin/daily | 390x844, 430x932 | PASS |
| /app/checkin/weekly | 390x844, 430x932 | PASS |
| /app/content | 390x844, 430x932 | PASS |
| /app/challenges | 390x844, 430x932 | PASS; overflow 390 corrigido |
| /app/profile | 390x844, 430x932 | PASS para QA interno |
| /app/billing | 390x844, 430x932 | PASS para QA interno |

## QA funcional do aluno pos-visual

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

## Bloqueios resolvidos

- Auth real
- Claims reais
- Permission denied no admin dashboard
- Sidebar duplicada
- Canvas centralizado
- Rules collectionGroup testadas
- Indices Firestore do Launch Dashboard criados e filtros server-side restaurados
- Normalizacao de datas preparada: novos writes/seeds usam Timestamp e backfill dry-run existe
- Aluno billing sem permission denied
- Challenge join sem `photoURL: undefined`
- Overflow horizontal em /app/challenges no viewport 390

## Pendencias importantes

- Reabrir decisao de ambientes antes de usuario real, pagamento real ou dado real de cliente
- Executar backfill de datas com aprovacao explicita se for necessario limpar documentos legados ISO antes de escala
- Expandir screenshots para o restante do produto antes de Beta externo

## Datas Firestore

| Item | Status |
|---|---|
| Padrao oficial Timestamp documentado | PASS |
| `adminLaunchService` com cursores Timestamp | PASS |
| Seeds/smoke de QA escrevendo Timestamp nos campos relevantes | PASS |
| Backfill dry-run de datas | PASS |
| Backfill apply | Pendente; exige aprovacao explicita |

Dry-run em 2026-05-07: 52 documentos escaneados, 41 documentos seriam atualizados, 0 escritos, 0 campos invalidos.

Screenshot de validacao: `qa/date-normalization/admin-dashboard-date-normalization-1440.png`

## Firestore indexes

| Collection Group | Campo | Status |
|---|---|---|
| workoutSessions | startedAt | PASS; single-field collection group index criado e validado no browser |
| dietDays | createdAt | PASS; single-field collection group index criado e validado no browser |
| dailyCheckins | createdAt | PASS; single-field collection group index criado e validado no browser |

Screenshot de validacao: `qa/firestore-indexes/admin-dashboard-index-validation-final.png`

## Guardrails

- Bypass QA local nao prova permissao Firestore.
- Nao publicar rules em producao sem confirmacao formal de ambiente.
- Nao declarar Beta externo, Production Ready ou "100% V2" em sentido publico/produto completo.
