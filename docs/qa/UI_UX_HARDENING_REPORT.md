# Expert Club - UI/UX Hardening Report

## Escopo

- Admin: dashboard, metrics, workspaces, users, subscriptions, affiliates, content, financeiro, commissions, payouts, support, settings.
- Mentor: overview, alunos, check-ins, financeiro, influencers, prescritores.
- Student: consistencia visual e actionability das rotas principais mobile.

## Status

Parcial: visual melhorado, actionability ainda pendente.

Atualizacao 2026-05-08: Student mobile recovery validado para QA interno controlado. O shell mobile foi recuperado, `/app/today` deixou de mostrar `Overview`/`Admin`, a bottom nav ficou unica e legivel, screenshots 390/430/1440 foram gerados em `qa/student-mobile-recovery/`, e `/app/workouts/session/:id` foi validado com sessao real iniciada pelo fluxo do app.

Atualizacao 2026-05-08: Student V2 visual parity validado para QA interno controlado. A camada mobile do aluno foi migrada para a familia light premium V2 compartilhada com admin/mentor, com nova matriz completa em `qa/student-v2-visual-parity/`.

Nao e Beta externo.
Nao e Production Ready.
Nao e app pronto para escala.

## Problemas corrigidos

| Categoria | Antes | Depois |
|---|---|---|
| Contraste global | Fundo muito branco, bordas quase invisiveis e texto secundario fraco. | Desktop V2 usa fundo light premium menos estourado, bordas mais legiveis e texto secundario com contraste real. |
| Cards operacionais | Cards antigos escuros pareciam blocos colados no fundo claro. | Cards dentro do shell desktop foram normalizados para superficies claras com borda, sombra e tipografia coerentes. |
| KPIs | Labels pequenos/fracos e valores com hierarquia instavel. | KPIs ganharam altura, peso visual, labels mais legiveis e valores sem dependencia de texto branco. |
| Badges/status | Pills pequenas e fracas, especialmente em tabelas. | Badges V2 ganharam tamanho minimo, peso maior, borda e cores com contraste por estado. |
| Tabelas | Headers e linhas com leitura fraca. | Headers, hover, divisoes e texto de celulas receberam contraste e densidade melhores. |
| Inputs/forms | Campos escuros ou lavados dependendo da tela. | Inputs/selects/textareas no shell desktop foram normalizados para branco, borda visivel e foco violeta. |
| Acoes falsas | Topbar e alguns CTAs pareciam ativos sem fluxo real. | Controles sem backend/rota ficaram disabled com motivo explicito. |
| Confirmacoes nativas | Fluxos admin usavam `window.confirm` como UX final. | Catalogo, comissoes, comunidade admin e user detail deixaram de usar confirm nativo nos fluxos principais. |
| Erros nativos | Perfil, checkout e treino finalizado usavam `alert()`. | Erros/sucesso agora aparecem como estado inline nas rotas corrigidas. |
| Conteudo aluno | Card de material e download pareciam clicaveis sem fluxo real. | Card deixou de parecer clicavel e download ficou disabled com motivo. |
| Diet day | `/app/diets/today` gravava `undefined` em campos planejados. | `dietDayService.buildFromDiet` usa fallback numerico seguro nos campos de macro/caloria. |
| Shell mobile aluno | App preso como coluna no canto esquerdo do desktop e shell duplicado. | Shell do aluno ocupa viewport mobile e centraliza preview de 430px no desktop. |
| Identidade aluno | `/app/today` exibia `Overview`, `Admin` e dados herdados. | Tela passa a exibir `Hoje`, saudacao de aluno e progresso operacional. |
| Check-in diario | Console podia exibir erro de indice em `workoutSessions.startedAt`. | Indices publicados e fallback local apenas para erro de indice em propagacao. |
| Paridade visual aluno | Aluno ainda parecia outro app, com dark legado e cards apertados em conteudo/desafios. | Aluno usa V2 light premium, cards claros, bottom nav consistente, screenshots completos 390/430/1440. |

## Componentes-base alterados

| Componente | Correcao |
|---|---|
| `ExpertClubDesktopShell` | Controles de periodo, workspace, busca global e notificacoes ficam desabilitados com `title` explicativo. |
| `V2Button` | Suporte a `title` e `aria-disabled` para acoes desabilitadas com motivo. |
| `ConfirmButton` | Deixou de usar `window.confirm`; usa confirmacao inline com cancelar/confirmar. |
| `SettingsRow` | Linhas sem acao real no perfil deixam de renderizar como `button`. |
| `index.css` | Overrides finais do desktop V2 para contraste, cards, badges, tabelas, inputs, botoes e estados disabled. |

## Telas alteradas

| Rota | Correcao |
|---|---|
| `/admin/dashboard` | Base visual de KPIs, funil, alertas e cards melhorada via foundation V2. |
| `/admin/metrics` | Mesmo hardening do dashboard, por compartilhar o dashboard de lancamento. |
| `/admin/workspaces` | Cards antigos dentro do shell desktop deixam de destoar como blocos escuros. |
| `/admin/users` | Botao de filtros avancados sem fluxo virou disabled com motivo; tabela/badges melhorados por foundation. |
| `/admin/users/:id` | Remocao de confirm nativo para auto-democao; a acao agora e bloqueada por seguranca. |
| `/admin/content` | Validacao de URL do YouTube deixou de usar `alert()` e passou a mostrar erro inline. |
| `/admin/content/new` | Editor revisado sem alert/confirm nativo no fluxo principal. |
| `/admin/affiliates` | Fluxo principal permanece real; CTA de criacao mantido quando conectado. |
| `/admin/financeiro` | Cards e links financeiros ficam visualmente integrados ao shell. |
| `/admin/commissions` | Criacao de payout deixou de depender de `window.confirm`. |
| `/admin/payouts` | Exportacao CSV deixa de usar `alert()` e mostra status inline. |
| `/admin/support` | Cards e aviso de schema sem tickets ficam mais legiveis. |
| `/admin/settings` | Salvar comunidade permanece conectado ao service real. |
| `/mentor/alunos` | CTA de detalhe sem rota real fica disabled com motivo. |
| `/mentor/checkins` | CTA de historico sem rota real fica disabled com motivo. |
| `/mentor/treinos/prescritor` | Tela de prescricao V2 permanece honesta como modulo em breve, sem feature fake. |
| `/mentor/dietas/prescritor` | Tela de nutricao V2 permanece honesta como modulo em breve, sem feature fake. |
| `/app/profile` | Logout usa confirmacao inline; sucesso/erro de salvar perfil aparece inline; gerenciar assinatura navega para `/app/billing`. |
| `/app/workouts/session/:id` | Compartilhar sem Web Share copia resultado e mostra feedback inline. |
| `/app/content` | Download de material sem fluxo real fica disabled com motivo. |
| `/app/billing/plans` | Erro de checkout aparece inline, sem `alert()`. |
| `/app/today` | Recuperacao mobile: shell centralizado, texto correto de aluno, cards de progresso e missoes reais. |
| `/app/workouts` | Cards de treino mais densos e sem area vazia dominante. |
| `/app/workouts/session/:id` | Empty state PWA para sessao inexistente; sessao real util ainda pendente. |
| `/app/workouts/session/:id` | Pass 2: sessao real validada com registro de serie, navegacao entre exercicios e conclusao sem erro. |
| `/app/diets/today` | Compatibilidade de refeicao concluida com `completed` e legado `consumed`. |
| `/app/diets/today` | Pass 2: empty state honesto quando dieta tem macros, mas nao tem refeicoes configuradas. |
| `/app/checkin/daily` | Console sem erro apos deploy de indices e fallback estreito para propagacao. |
| `/app/content` | Pass 2: busca sem fluxo fica disabled com motivo. |
| `/app/challenges` | Pass 2: participacao usa feedback inline e compartilhar ranking sem fluxo fica disabled com motivo. |

## QA visual

| Rota | Viewport | Screenshot | Legivel? | Acoes falsas? | Status |
|---|---:|---|---|---|---|
| `/admin/dashboard` | 1440x900 | `qa/ui-ux-hardening/admin-dashboard-1440-pass2.png` | Sim | Nao observadas no recorte | PASS |
| `/admin/workspaces` | 1440x900 | `qa/ui-ux-hardening/admin-workspaces-1440-pass2.png` | Sim | Nao observadas no recorte | PASS |
| `/admin/subscriptions` | 1440x900 | `qa/ui-ux-hardening/admin-subscriptions-1440-pass2.png` | Sim | Nao observadas no recorte | PASS |
| `/admin/users` | 1440x900 | `qa/ui-ux-hardening/admin-users-1440-pass2.png` | Sim | Filtro avancado disabled com motivo | PASS |
| `/admin/users/:id` | 1440x900 | `qa/ui-ux-hardening/admin-user-detail-1440-pass2.png` | Sim | Auto-democao bloqueada por seguranca | PASS |
| `/admin/affiliates` | 1440x900 | `qa/ui-ux-hardening/admin-affiliates-1440-pass2.png` | Sim | Nao observadas no recorte | PASS |
| `/admin/affiliates/:id` | 1440x900 | `qa/ui-ux-hardening/admin-affiliate-detail-1440-pass2.png` | Sim | Nao observadas no recorte | PASS |
| `/admin/content` | 1440x900 | `qa/ui-ux-hardening/admin-content-1440-pass2.png` | Sim | Acoes principais conectadas | PASS |
| `/admin/content/new` | 1440x900 | `qa/ui-ux-hardening/admin-content-new-1440-pass2.png` | Sim | Erros inline | PASS |
| `/admin/financeiro` | 1440x900 | `qa/ui-ux-hardening/admin-financeiro-1440-pass2.png` | Sim | Links navegam para rotas reais | PASS |
| `/admin/commissions` | 1440x900 | `qa/ui-ux-hardening/admin-commissions-1440-pass2.png` | Sim | Confirm nativo removido | PASS |
| `/admin/payouts` | 1440x900 | `qa/ui-ux-hardening/admin-payouts-1440-pass2.png` | Sim | Status inline para export | PASS |
| `/admin/support` | 1440x900 | `qa/ui-ux-hardening/admin-support-1440-pass2.png` | Sim | Links navegam para rotas reais | PASS |
| `/admin/metrics` | 1440x900 | `qa/ui-ux-hardening/admin-metrics-1440-pass2.png` | Sim | Nao observadas no recorte | PASS |
| `/admin/settings` | 1440x900 | `qa/ui-ux-hardening/admin-settings-1440-pass2.png` | Sim | Salvar conectado | PASS |
| `/mentor/overview` | 1440x900 | `qa/ui-ux-hardening/mentor-overview-1440-pass2.png` | Sim | Nao observadas no recorte | PASS |
| `/mentor/alunos` | 1440x900 | `qa/ui-ux-hardening/mentor-alunos-1440-pass2.png` | Sim | Detalhe disabled com motivo | PASS |
| `/mentor/checkins` | 1440x900 | `qa/ui-ux-hardening/mentor-checkins-1440-pass2.png` | Sim | Historico disabled com motivo | PASS |
| `/mentor/financeiro` | 1440x900 | `qa/ui-ux-hardening/mentor-financeiro-1440-pass2.png` | Sim | Nao observadas no recorte | PASS |
| `/mentor/influencers` | 1440x900 | `qa/ui-ux-hardening/mentor-influencers-1440-pass2.png` | Sim | Nao observadas no recorte | PASS |
| `/mentor/treinos/prescritor` | 1440x900 | `qa/ui-ux-hardening/mentor-treinos-prescritor-1440-pass2.png` | Sim | Modulo em breve honesto | PASS |
| `/mentor/dietas/prescritor` | 1440x900 | `qa/ui-ux-hardening/mentor-dietas-prescritor-1440-pass2.png` | Sim | Modulo em breve honesto | PASS |
| `/app/today` | 390x844 | `qa/ui-ux-hardening/student-today-390-pass2.png` | Sim | Nao observadas no recorte | PASS |
| `/app/workouts` | 390x844 | `qa/ui-ux-hardening/student-workouts-390-pass2.png` | Sim | Nao observadas no recorte | PASS |
| `/app/workouts/:id` | 390x844 | `qa/ui-ux-hardening/student-workout-detail-390-pass2.png` | Sim | Nao observadas no recorte | PASS |
| `/app/workouts/session/:id` | 390x844 | `qa/ui-ux-hardening/student-workout-session-390-pass2.png` | Parcial | Sessao usada no screenshot nao continha conteudo util | ATENCAO |
| `/app/diets` | 390x844 | `qa/ui-ux-hardening/student-diets-390-pass2.png` | Sim | Nao observadas no recorte | PASS |
| `/app/diets/today` | 390x844 | `qa/ui-ux-hardening/student-diet-today-390-pass2.png` | Sim | Erro de `undefined` corrigido | PASS |
| `/app/checkin/daily` | 390x844 | `qa/ui-ux-hardening/student-checkin-daily-390-pass2.png` | Sim | Console ainda pode exigir indice `workoutSessions.startedAt` publicado | ATENCAO |
| `/app/checkin/weekly` | 390x844 | `qa/ui-ux-hardening/student-checkin-weekly-390-pass2.png` | Sim | Nao observadas no recorte | PASS |
| `/app/content` | 390x844 | `qa/ui-ux-hardening/student-content-390-pass2.png` | Sim | Download disabled com motivo | PASS |
| `/app/challenges` | 390x844 | `qa/ui-ux-hardening/student-challenges-390-pass2.png` | Sim | Nao observadas no recorte | PASS |
| `/app/profile` | 390x844 | `qa/ui-ux-hardening/student-profile-390-pass2.png` | Sim | Confirm/alert removidos | PASS |
| `/app/billing` | 390x844 | `qa/ui-ux-hardening/student-billing-390-pass2.png` | Sim | Nao observadas no recorte | PASS |
| `/app/today` | 390x844 | `qa/student-mobile-recovery/student-today-390.png` | Sim | Nao observadas no recorte | PASS |
| `/app/today` | 430x932 | `qa/student-mobile-recovery/student-today-430.png` | Sim | Nao observadas no recorte | PASS |
| `/app/today` | 1440x900 | `qa/student-mobile-recovery/student-today-1440.png` | Sim, preview centralizado | Nao observadas no recorte | PASS |
| `/app/workouts/session/:id` | 390x844 | `qa/student-mobile-recovery/student-workout-session-390.png` | Sim | Sessao real util nao validada | PENDENTE |
| `/app/workouts/session/:id` | 390x844 | `qa/student-mobile-recovery/student-workout-session-real-390-pass2.png` | Sim | Serie registrada em sessao real | PASS |
| `/app/checkin/daily` | 430x932 | `qa/student-mobile-recovery/student-checkin-daily-430.png` | Sim | Sem erro de console observado | PASS |
| Todas as rotas do aluno | 390/430/1440 | `qa/student-v2-visual-parity/` | Sim | Acoes falsas relevantes controladas no escopo aluno | PASS |

## Pendencias

| Item | Gravidade | Motivo |
|---|---|---|
| `alert()`/`confirm()` em rotas antigas e areas fora da matriz principal | Medio | Ainda existem ocorrencias em arquivos antigos de admin diets/workouts/exercises/foods, affiliate, community e onboarding. Algumas estao roteadas, mas fora do fluxo principal validado nesta passada. |
| `/app/workouts/session/:id` com screenshot sem conteudo util | Medio | A sessao `smoke_session_a` nao garantiu tela operacional completa; precisa recapturar com sessionId real ativa. |
| Indice `workoutSessions.startedAt` reportado no console de `/app/checkin/daily` | Medio | `firestore.indexes.json` foi ajustado para ASC/DESC, mas o deploy/build de indice nao foi executado nesta PR por restricao do gate. |
| Comunidade e afiliados publicos ainda usam UX nativa | Medio | Rotas existem, mas nao fazem parte da matriz admin/mentor/student principal desta passada. |
| Dieta com refeicoes reais | Medio | `/app/diets/today` tem empty state honesto quando nao ha refeicoes; ainda vale validar plano completo com refeicoes reais antes de usuarios reais. |
