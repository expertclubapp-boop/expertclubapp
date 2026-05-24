# Expert Club - Project Status

Atualizado em 2026-05-15

## Status atual

Student Evolution Report V1 validado para QA interno controlado.

Continuam válidos:

- Role Model + Navigation + Logout P0
- Admin Student 360º
- Admin Check-ins Review Flow
- Admin Prescription Operations
- Prescriptor Flow Integrity
- Prescription Assignments Read Path no ambiente remoto
- Student Workout Execution Premium
- Student Onboarding + Preferences
- Template Metadata + Recommendation Engine V1
- Low Ticket Dashboard + Daily Engagement
- Automated Check-in Insights V1
- Student Evolution Report V1
- Student Visual Legibility Hotfix

Continuam não permitidos:

- Beta externo
- Production Ready
- pronto para escala

## O que aconteceu nesta rodada

### 0. Security + Actionability Critical Cleanup

Status: concluido para QA interno controlado.

- Decisao registrada: affiliate nao e aluno premium e nao bypassa subscription gate da area de aluno.
- `firestore.rules` restringe `canUseStudentApp()` a `member` com assinatura ativa.
- Affiliate mantem acesso somente a propria area/dados agregados permitidos: propria `affiliateAccount` e proprio `affiliateDashboard`.
- Placeholder WhatsApp `5511999999999` removido/desabilitado; CTA informa que o canal de suporte ainda nao esta configurado.
- `href="#"` removido de rota ativa.
- `console.log` removido do app/functions de producao; scripts locais permanecem como CLI.
- Mock hardcoded `Opção A/B` removido da substituicao alimentar real; tela mostra empty state honesto quando nao ha alternativa aprovada.
- Alerts/confirms nativos restantes em rotas ativas substituidos por toasts ou confirmacao inline.

Veredito: Critical cleanup validado para QA interno controlado.

### 1. Ambiente Firebase formalizado

- `docs/firebase/FIREBASE_ENVIRONMENT_DECISION_RECORD.md` preenchido com decisao do owner.
- `expertcoaching-b91e2` tratado como ambiente unico de pre-lancamento / QA controlado enquanto nao houver usuarios reais.
- Confirmado que `VITE_FIREBASE_PROJECT_ID` em Vercel Production aponta para `expertcoaching-b91e2`.
- Antes de usuarios reais, pagamento real ou dados reais de clientes, escolher estrategia final de ambientes.
- Separacao staging/production segue como gate antes de usuario real/pagamento real/dado real, nao como P0 imediato de pre-lancamento/QA interno.
- Seguir `docs/firebase/FIREBASE_STAGING_QA_SETUP.md` se a decisao for separar staging/QA.
- `VITE_ENABLE_DEV_SEED` removida/restringida de Production.
- Bloquear deploy publico/escala sem decisao final de ambientes.

### 2. Student Evolution Report V1

1. a plataforma ganhou o primeiro relatório real de evolução do aluno, calculado sob demanda com dados de corpo, treino, dieta, água e check-ins;
2. `/app/evolution` agora exibe filtros de `15` e `30` dias, consistência, resumo automático e próximos passos sem gráfico fake;
3. `/app/today` agora mostra preview de evolução com CTA real para o relatório;
4. `Admin Student 360` passou a combinar risco de abandono com consistência e métricas do relatório;
5. o backfill dry-run continuou limpo, sem reabrir dívida de datas.

## Resultado funcional

- perfil, recomendações, check-ins, dieta, treino, hidratação e Student 360 seguiram íntegros;
- o produto low ticket agora consegue transformar atividade recente em evolução visível sem depender de resposta manual;
- não apareceu documento novo pendente no backfill dry-run;
- release externo continua bloqueado.

## Validações

| Comando | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run smoke:roles` | PASS |
| `npm run test:rules` | PASS |
| `npm run smoke:setup:dry` | PASS |
| `npm run backfill:date-fields -- --dry-run` | PASS (`wouldUpdate: 0`, `invalid: 0`) |

## Observações

- a nova camada de evolução não adicionou `as any` nem `toISOString` operacional nos arquivos novos;
- ainda existem dívidas legadas de `as any` e `toISOString` em telas admin antigas fora deste fluxo;
- não houve deploy nesta rodada;
- não houve backfill apply;
- release externo continua bloqueado.

## Veredito permitido

- Student Evolution Report V1 validado para QA interno controlado
