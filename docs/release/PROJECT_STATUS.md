# Expert Club — Status Oficial

## Status atual

O Expert Club esta aprovado para QA interno controlado.

Ainda nao esta aprovado para:

- Beta externo
- Production Ready
- Escala com muitos usuarios
- Deploy sensivel sem ambiente formalizado
- Ambiente final para usuarios reais sem nova decisao

## Gates obrigatorios antes de avancar

### 1. Ambiente Firebase formalizado

- `docs/firebase/FIREBASE_ENVIRONMENT_DECISION_RECORD.md` preenchido com decisao do owner.
- `expertcoaching-b91e2` tratado como ambiente unico de pre-lancamento / QA controlado enquanto nao houver usuarios reais.
- Confirmado que `VITE_FIREBASE_PROJECT_ID` em Vercel Production aponta para `expertcoaching-b91e2`.
- Antes de usuarios reais, pagamento real ou dados reais de clientes, escolher estrategia final de ambientes.
- Seguir `docs/firebase/FIREBASE_STAGING_QA_SETUP.md` se a decisao for separar staging/QA.
- `VITE_ENABLE_DEV_SEED` removida/restringida de Production.
- Bloquear deploy publico/escala sem decisao final de ambientes.

### 2. Rollback operacional completo

Status: concluido para QA interno controlado.

- Hosting oficial: Vercel
- Aprovador: Ruben
- Frontend rollback: Vercel Deployments
- Firestore Rules rollback: restaurar `firestore.rules` + `npm run test:rules` + deploy controlado
- Plano: `docs/release/ROLLBACK_PLAN.md`

### 3. Firestore indexes

- Indices necessarios para o Launch Dashboard criados em `expertcoaching-b91e2`.
- Filtros server-side restaurados em `src/services/adminLaunchService.ts`.
- `/admin/dashboard` validado com admin real apos propagacao dos indices.
- Screenshot: `qa/firestore-indexes/admin-dashboard-index-validation-final.png`.
- Antes de escala real, revalidar volume, custo, latencia e estrategia final de ambientes.
- AdminMetricsService Query Hardening aplicado: `adminMetricsService.ts` e `adminLaunchService.ts` usam filtros/limits para evitar scans globais perigosos.
- Novo indice single-field collection group definido para `bodyCheckins.createdAt`; deploy nao executado nesta PR e deve ser aplicado/validado antes de depender desse recorte no ambiente remoto.
- Metricas secundarias de atividade usam fallback parcial sem mascarar `permission-denied`; metricas criticas continuam falhando explicitamente.

### 4. Normalizacao de datas

Status: preparada para QA interno controlado; aguardando backfill apply se for necessario limpar dados legados.

- Padrao oficial: Firestore Timestamp para campos usados em query, ordenacao, metricas e dashboards.
- Helper central: `src/lib/firebase/date.ts`.
- Documento: `docs/firebase/FIRESTORE_DATE_FIELDS.md`.
- Backfill dry-run: `npm run backfill:date-fields -- --dry-run`.
- Backfill apply exige confirmacao explicita e nao deve ser rodado sem aprovacao.
- Dry-run em 2026-05-07: 52 documentos escaneados, 41 documentos seriam atualizados, 0 escritos.
- Browser QA: `/admin/dashboard` validado em `qa/date-normalization/admin-dashboard-date-normalization-1440.png`.

### 5. Student mobile recovery

Status: validado para QA interno controlado.

- Shell mobile do aluno recuperado.
- Desktop preview centralizado em canvas mobile de 430px.
- `/app/today` nao exibe mais `Overview`, `Admin` ou identidade administrativa.
- Bottom nav unica, fixa e legivel.
- Screenshots gerados em `qa/student-mobile-recovery/`.
- `/app/checkin/daily` validado sem erro de console apos deploy de indices e fallback estreito para propagacao.
- `/app/workouts/session/:id` validado com sessao real: iniciar treino, registrar serie, navegar exercicios e concluir treino.
- `/app/diets/today`, `/app/content` e `/app/challenges` receberam pass 2 de actionability e consistencia mobile.
- Documento: `docs/qa/STUDENT_MOBILE_RECOVERY_REPORT.md`.
- Paridade visual V2: validada em `docs/qa/STUDENT_V2_VISUAL_PARITY_REPORT.md`.
- Screenshots completos: `qa/student-v2-visual-parity/` com 12 rotas em 390x844, 430x932 e 1440x900.

Pendencias antes de usuarios reais:

- Validar `/app/diets/today` com dieta contendo refeicoes reais, nao apenas empty state de plano sem refeicoes.
- Continuar refinamento editorial de `/app/content` e `/app/challenges` se o escopo de produto crescer.

## Status dos indices Firestore

| Collection Group | Campo | Status |
|---|---|---|
| workoutSessions | startedAt | Criado e validado para QA interno controlado |
| dietDays | createdAt | Criado e validado para QA interno controlado |
| dailyCheckins | createdAt | Criado e validado para QA interno controlado |

## Regra de decisao

Qualquer avanco alem de QA interno controlado sem respeitar estes gates e narrativa, nao gate tecnico.

## Regra antes de usuarios reais

Antes de entrar usuario real, pagamento real ou dado real de cliente, reabrir a decisao de ambientes e escolher uma estrategia final para dev/staging/production.

## Pendencia antes de escala

Executar backfill apply de datas, se a base ainda tiver documentos legados com ISO string, e validar as metricas no ambiente que receber usuarios reais.

Motivo:

- o codigo novo escreve Timestamp;
- documentos legados podem continuar com ISO string ate o backfill apply;
- queries server-side por Timestamp nao devem depender de dados mistos em escala.
