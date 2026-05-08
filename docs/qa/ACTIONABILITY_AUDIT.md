# Expert Club - Actionability Audit

## Regra

Toda acao deve ser funcional, disabled com motivo ou removida. Acoes ativas sem backend, rota ou efeito real nao devem permanecer visiveis como CTAs operacionais.

## Auditoria

| Rota | Acao | Antes | Depois | Status |
|---|---|---|---|---|
| Shell admin/mentor | Filtro de periodo | Botao visualmente ativo sem fluxo de filtro conectado. | Disabled com motivo: filtro de periodo ainda nao altera a visao. | Corrigido |
| Shell admin/mentor | Workspace selector | Botao visualmente ativo sem troca real de workspace. | Disabled com motivo; admin explica colecoes globais, mentor explica workspace fixo. | Corrigido |
| Shell admin/mentor | Busca global | Icone clicavel sem busca conectada no shell. | Disabled com motivo: busca global ainda nao conectada. | Corrigido |
| Shell admin/mentor | Notificacoes | Icone clicavel sem central conectada. | Disabled com motivo: central ainda nao conectada. | Corrigido |
| `/admin/users` | Mais filtros | Botao ativo sem painel avancado. | Disabled com motivo; busca e filtro de role continuam funcionais. | Corrigido |
| `/admin/users` | Abrir usuario | Navegacao real para `/admin/users/:uid`. | Mantido funcional. | OK |
| `/admin/users/:id` | Remover proprio admin | `window.confirm` permitia confirmar acao sensivel. | Acao bloqueada com toast de seguranca. | Corrigido |
| `/admin/content` | Novo | Navega para editor real. | Mantido funcional. | OK |
| `/admin/content/new` | Salvar conteudo YouTube invalido | `alert()` bloqueava o fluxo. | Erro inline legivel antes de salvar. | Corrigido |
| `/admin/content/*` | Arquivar recurso | Confirmacao nativa. | `ConfirmButton` inline com cancelar/confirmar. | Corrigido |
| `/admin/diets/*` e `/admin/workouts/*` via `AdminCatalogScreens` | Publicar/rollback | `window.confirm` em publish/rollback. | Fluxo executa pela acao de historico/editor sem confirm nativo. | Corrigido |
| `/admin/affiliates` | Nova Afiliada | Fluxo real de criacao inline. | Mantido funcional. | OK |
| `/admin/commissions` | Criar pagamento selecionado | `window.confirm`. | Acao real com validacao de selecao e toast de sucesso/erro. | Corrigido |
| `/admin/financeiro` | Gerir comissoes | Rota real `/admin/commissions`. | Mantido funcional. | OK |
| `/admin/financeiro` | Gerir repasses | Rota real `/admin/payouts`. | Mantido funcional. | OK |
| `/admin/payouts` | Exportar CSV | `alert()` apos copiar CSV. | Status inline de sucesso/erro. | Corrigido |
| `/admin/support` | Moderacao | Rota real `/admin/community`. | Mantido funcional. | OK |
| `/admin/support` | Atendimento por usuario | Rota real `/admin/users`. | Mantido funcional. | OK |
| `/admin/support` | Cobranca e status | Rota real `/admin/subscriptions`. | Mantido funcional. | OK |
| `/admin/community` | Aprovar/ocultar/arquivar post | `window.confirm` no handler. | Acao executa service real e reporta via toast. | Corrigido |
| `/admin/settings` | Salvar comunidade | Service real `adminCommunityService.save`. | Mantido funcional. | OK |
| `/mentor/alunos` | Detalhes | CTA ativo sem detalhe de aluno no workspace mentor. | Disabled com motivo explicito. | Corrigido |
| `/mentor/checkins` | Abrir historico | CTA ativo sem rota de historico detalhado do mentor. | Disabled com motivo explicito. | Corrigido |
| `/mentor/overview` | Acoes rapidas | Links reais para check-ins, alunos e financeiro. | Mantido funcional. | OK |
| `/mentor/treinos/prescritor` | CTA de prescricao V2 | Poderia sugerir fluxo fake. | Tela honesta de modulo em breve, sem botao ativo falso. | OK |
| `/mentor/dietas/prescritor` | CTA de nutricao V2 | Poderia sugerir fluxo fake. | Tela honesta de modulo em breve, sem botao ativo falso. | OK |
| `/app/profile` | Sair da conta | `confirm()` nativo. | Confirmacao inline com cancelar/sair. | Corrigido |
| `/app/profile` | Salvar perfil com erro | `alert()` nativo. | Feedback inline de erro/sucesso. | Corrigido |
| `/app/profile` | Linhas sem acao real | Renderizadas como `button`. | Renderizadas como `div` quando nao ha `onClick`. | Corrigido |
| `/app/profile` | Gerenciar assinatura | Botao solto sem acao. | Navega para `/app/billing`. | Corrigido |
| `/app/workouts/session/:id` | Compartilhar sem Web Share | `alert()` apos copiar. | Feedback inline de copia. | Corrigido |
| `/app/workouts/session/:id` | Sessao inexistente | Texto cru `Sessao nao encontrada` fora do padrao PWA. | Empty state dark com CTA real para `/app/workouts`. | Corrigido parcialmente |
| `/app/workouts/:id` | CTA iniciar treino | Bottom nav interceptava o clique em mobile. | CTA reposicionado acima da bottom nav; sessao real criada pelo fluxo. | Corrigido |
| `/app/workouts/session/:id` | Concluir treino | Firestore recusava `undefined` em `prs.previousValue`. | Payload passa a gravar valor numerico seguro; conclusao validada. | Corrigido |
| `/app/today` | Cards de missao | Cards vazios/herdados com seta e texto administrativo. | Cards navegam para check-in, treino, dieta ou hidratacao com estado real/empty state. | Corrigido |
| `/app/diets/today` | Refeicao concluida | Tela lia `consumed`, mas o service grava `completed`. | Leitura aceita `completed` e legado `consumed`. | Corrigido |
| `/app/diets/today` | Dieta sem refeicoes | Tela parecia pobre/vazia. | Empty state honesto com CTA real para biblioteca de dietas. | Corrigido |
| `/app/checkin/daily` | Progresso recente | Erro de indice podia derrubar a leitura de progresso no console. | Query mantida; fallback local apenas para erro de indice em propagacao. | Corrigido |
| `/app/content` | Busca | Icone parecia ativo sem fluxo real. | Disabled com motivo explicito. | Corrigido |
| `/app/challenges` | Quero participar | Fluxo usava reload. | Feedback inline e estado participando otimista. | Corrigido |
| `/app/challenges` | Compartilhar ranking | Botao ativo sem fluxo real. | Disabled com motivo explicito. | Corrigido |
| `/app/content` | Download de material | Botao ativo sem fluxo real. | Disabled com motivo. | Corrigido |
| `/app/content` | Cards mock | `cursor-pointer` sugeria clique. | Cursor removido nos mocks. | Corrigido |
| `/app/billing/plans` | Checkout com erro | `alert()` nativo. | Mensagem inline no topo. | Corrigido |

## Acoes funcionais conectadas

| Rota | Acao | Service/Rota |
|---|---|---|
| `/admin/users` | Abrir usuario | `/admin/users/:uid` |
| `/admin/content` | Novo/editar/ver/excluir | `adminContentService` e rotas `/admin/content/*` |
| `/admin/affiliates` | Criar/abrir afiliada | `adminAffiliateService` e `/admin/affiliates/:affiliateId` |
| `/admin/commissions` | Criar payout | `adminCommissionService.createPayout` |
| `/admin/financeiro` | Gerir comissoes | `/admin/commissions` |
| `/admin/financeiro` | Gerir repasses | `/admin/payouts` |
| `/admin/support` | Moderacao | `/admin/community` |
| `/admin/settings` | Salvar comunidade | `adminCommunityService.save` |
| `/app/profile` | Gerenciar assinatura | `/app/billing` |
| `/app/workouts/session/:id` | Compartilhar | Web Share API ou clipboard |
| `/app/workouts/session/:id` | Voltar para treinos quando sessao nao existe | `/app/workouts` |
| `/app/workouts/session/:id` | Registrar serie/concluir treino | `workoutSessionService.updateSession` |
| `/app/today` | Check-in, treino, dieta, hidratacao | `/app/checkin/daily`, `/app/workouts/:id`, `/app/diets/today`, `/app/hydration` |

## Acoes desabilitadas com motivo

| Rota | Acao | Motivo exibido ao usuario |
|---|---|---|
| Shell admin/mentor | Periodo | Filtro de periodo ainda nao altera esta visao. |
| Shell admin | Workspace | Multi-workspace ainda nao esta operacional; a visao usa colecoes globais. |
| Shell mentor | Workspace | Workspace do mentor e fixo para a carteira atual. |
| Shell admin/mentor | Busca global | Busca global ainda nao esta conectada neste shell. |
| Shell admin/mentor | Notificacoes | Central de notificacoes ainda nao esta conectada. |
| `/admin/users` | Filtros ativos | Filtros avancados ainda nao existem neste modulo. |
| `/mentor/alunos` | Detalhes | Detalhe do aluno ainda nao esta disponivel no workspace do mentor. |
| `/mentor/checkins` | Abrir historico | Historico detalhado ainda nao esta disponivel no workspace do mentor. |
| `/app/content` | Download de material | Download de materiais ainda nao esta disponivel neste modulo. |
| `/app/content` | Busca de conteudos | Busca de conteudos ainda nao esta conectada neste modulo. |
| `/app/challenges` | Compartilhar ranking | Compartilhamento do ranking ainda nao esta disponivel neste modulo. |

## Acoes removidas

| Rota | Acao | Motivo |
|---|---|---|
| `/app/content` | Cursor de cards mock | Skeleton/mock nao deve parecer clicavel. |

## Ocorrencias legadas restantes

| Arquivo | Ocorrencia | Rota impactada | Decisao |
|---|---|---|---|
| `src/screens/admin/AdminDietEditorScreen.tsx` | `alert()` / `confirm()` | Rotas antigas de dieta fora do fluxo validado principal | Pendente; substituir por estado inline em passada dedicada de catalogo legado. |
| `src/screens/admin/AdminDietsScreen.tsx` | `alert()` / `confirm()` | Rotas antigas de dieta fora do fluxo validado principal | Pendente; substituir por estado inline em passada dedicada de catalogo legado. |
| `src/screens/admin/AdminWorkoutEditorScreen.tsx` | `alert()` / `confirm()` | Rotas antigas de treino fora do fluxo validado principal | Pendente; substituir por estado inline em passada dedicada de catalogo legado. |
| `src/screens/admin/AdminWorkoutsScreen.tsx` | `alert()` / `confirm()` | Rotas antigas de treino fora do fluxo validado principal | Pendente; substituir por estado inline em passada dedicada de catalogo legado. |
| `src/screens/admin/AdminExerciseEditorScreen.tsx` / `AdminExercisesScreen.tsx` | `alert()` / `confirm()` | Catalogo antigo de exercicios | Pendente; fora da matriz de screenshots desta passada. |
| `src/screens/admin/AdminFoodEditorScreen.tsx` / `AdminFoodsScreen.tsx` | `alert()` / `confirm()` | Catalogo antigo de alimentos | Pendente; fora da matriz de screenshots desta passada. |
| `src/screens/affiliate/*` | `alert()` | Portal/area de afiliado | Pendente; fora da matriz admin/mentor/student principal. |
| `src/screens/community/CommunityScreen.tsx` | `alert()` / `confirm()` | Comunidade do aluno | Pendente; fora das rotas solicitadas para screenshot nesta passada. |
| `src/screens/onboarding/PreferencesScreen.tsx` | `alert()` | Onboarding/preferences | Pendente; fora da matriz desta passada. |
| `src/utils/referral.ts` | `console.log` | Util dev/marketing | Revisar depois; nao e implementacao de botao em rota principal. |

## Veredito tecnico desta auditoria

Parcial: actionability ainda pendente.

Motivo: as rotas principais admin/mentor/student da matriz foram corrigidas e documentadas, e o shell mobile do aluno foi recuperado com sessao real de treino validada. Ainda existem ocorrencias legadas em arquivos roteados fora do recorte operacional principal. Nao declarar UI/UX hardening global completo enquanto essas ocorrencias existirem.

## Atualizacao - Student V2 visual parity

No escopo aluno mobile solicitado em `docs/qa/STUDENT_V2_VISUAL_PARITY_REPORT.md`, as acoes falsas relevantes foram tratadas como funcionais, disabled com motivo ou nao clicaveis. A pendencia de actionability permanece global, concentrada em rotas antigas fora da matriz aluno.
