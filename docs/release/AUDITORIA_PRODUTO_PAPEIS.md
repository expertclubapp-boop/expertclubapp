# Expert Club — Auditoria de Produto, Papéis e UX Operacional

## 1. Veredito executivo
- **O produto no código está modelado como:** Um híbrido confuso entre um SaaS B2B para múltiplos mentores (com gestão de comissões, workspaces e influenciadores) e um app de treino genérico, mas com metades das funcionalidades não implementadas (prescritores em breve, botões desativados).
- **O produto real deveria ser:** Um produto B2C/low ticket para alunos, vendido, administrado e operado centralmente pelo Ruben (Admin). O Admin deve ser o "Deus" do sistema, capaz de prescrever, ler check-ins e gerir tudo.
- **Principal desalinhamento:** O Admin consegue gerenciar pagamentos e catálogos, mas **não consegue ser o coach** do aluno. Ele não tem acesso aos check-ins e não existe um prescritor para associar um treino/dieta a um aluno específico. O Mentor, que deveria ser o coach, é uma casca visual com botões "Detalhes" desativados e prescritores "Em breve". Ninguém consegue operar o aluno.
- **Maior risco para entregar:** Os alunos entram, mas ficam "órfãos". Ninguém consegue analisar os seus check-ins, e não há como alterar o `selectedWorkoutId` ou `selectedDietId` do aluno pela interface.
- **Maior risco para o usuário:** Ficar preso no aplicativo e pagar por uma mentoria que não tem como ser entregue do outro lado. 
- **Maior risco operacional:** Ausência de `logout` nos dashboards administrativos/mentor, prendendo a sessão do operador; impossibilidade total de atendimento ao aluno.

## 2. Decisão recomendada de papéis
| Papel | Recomendação |
|---|---|
| **admin** | **Dono/prescritor/operador principal.** Deve herdar TODAS as capacidades de visualização do mentor, além de poder prescrever ativamente e responder check-ins. |
| **mentor** | **Remover/ocultar por agora.** A menos que existam coaches contratados trabalhando para o Ruben amanhã, o dashboard de mentor é código morto e gera ruído e confusão. |
| **member (aluno)** | **Manter.** Fluxo está razoável, mas falta receber feedback. |
| **affiliate** | **Manter.** Se o afiliado for fundamental para vendas low-ticket. |

## 3. Admin vs Mentor
| Função | Onde está hoje | Onde deveria estar |
|---|---|---|
| Ver alunos | Mentor (visual) e Admin (só dados de role/billing) | Admin (Visão unificada do paciente 360º) |
| Abrir perfil do aluno | Admin (básico) e Mentor (bloqueado) | Admin |
| Ver check-ins | Mentor (lista apenas, sem detalhes) | Admin |
| Responder check-ins | Nenhum lugar | Admin |
| Prescrever treino | Catálogo no Admin; "Em breve" no Mentor | Admin |
| Prescrever dieta | Catálogo no Admin; "Em breve" no Mentor | Admin |
| Financeiro | Admin e Mentor | Admin |

**Recomendação:** Unificar Admin + Mentor. O Admin vira operador completo. Mentor some da navegação principal.

## 4. Rotas que devem continuar
| Rota | Motivo |
|---|---|
| `/admin/dashboard` | Visão macro de negócio e métricas. |
| `/admin/users` e `/:id` | Gestão de base, mas precisa ser expandida para "Prontuário 360º". |
| `/admin/diets`, `/workouts` | Catálogo base de produtos. |
| `/admin/subscriptions` | Gestão comercial. |
| `/app/*` | Experiência do aluno. |

## 5. Rotas que devem ser ocultadas/removidas por enquanto
| Rota | Motivo |
|---|---|
| `/mentor/*` (TODAS) | O produto é operado pelo Admin. Manter duas interfaces que fazem metade do trabalho é anti-padrão. |
| `/admin/workspaces` | Inútil para um produto B2C de um único especialista. |

## 6. Funcionalidades quebradas ou falsas
| Área | Problema | Severidade |
|---|---|---|
| **Check-ins do Mentor** | O botão "ABRIR HISTÓRICO" está `disabled` com tooltip "não disponível". | **P0** (Ninguém lê o aluno) |
| **Alunos do Mentor** | O botão "DETALHES" está `disabled`. | **P0** |
| **Logout Admin/Mentor** | A topbar do `ExpertClubDesktopShell` não possui botão ou dropdown para Sair. Sessão presa. | **P0** |
| **Relatórios do Mentor** | Métricas estáticas / agregados sem filtros ou exportações reais. | P1 |

## 7. Prescritores
| Módulo | Status | Decisão |
|---|---|---|
| Prescritor catálogo Admin | Funcional, mas **NÃO** vincula ao aluno. Cria apenas templates. | Transformar em Catálogo Geral. |
| Prescritor treino/dieta Mentor | FAKE. Retorna uma tela dizendo "Em breve". | Remover. |
| **Prescrição 1:1** | **IMPLEMENTADA.** Admin atribui treino/dieta com motivo, histórico rastreável (`prescriptionAssignments`), snapshot do template e rastreabilidade de quem atribuiu. | Concluído. |

## 8. Check-ins
| Fluxo | Status | Decisão |
|---|---|---|
| Aluno envia diário/semanal | Funcional (`DailyCheckinScreen`). | Manter. |
| Admin vê lista / detalhe | **NÃO EXISTE rota de check-in para Admin.** | Criar aba de Check-ins no Admin. |
| Admin aprova/rejeita/feedback | Não existe. | Criar mecânica de resposta. |

## 9. Perfil do aluno (Visão Operador)
O `/admin/users/:id` foi transformado no Prontuário 360º.
| Bloco | Status | Decisão |
|---|---|---|
| Treino atual / Trocar | Implementado | Permitir "Atribuir Treino". |
| Dieta atual / Trocar | Implementado | Permitir "Atribuir Dieta". |
| Histórico de Check-ins | Implementado | Mostrar timeline detalhada e permitir Review. |

## 10. Logout e navegação
| Área | Problema | Correção |
|---|---|---|
| **Admin / Mentor** | O componente `ExpertClubDesktopTop` exibe nome/avatar mas é apenas visual. **Não tem como fazer logout.** | **P0:** Transformar o avatar em dropdown com "Sair", ou adicionar um `<LogOut />` visível na topbar ou na sidebar inferior. |
| **Aluno** | Possui logout escondido no final de "Perfil". O mobile bottom nav oculta o botão da sidebar. | Subir o botão de logout ou garantir acesso fácil. |

## 11. Localização PT-BR
| Inglês | Local | Tradução necessária |
|---|---|---|
| `active`, `past_due`, `cancelled` | Badges de alunos (Mentor e Admin) | Ativo, Atrasado, Cancelado |
| `fat_loss`, `hypertrophy` | Algumas exibições cruas | Emagrecimento, Hipertrofia |

**Recomendação:** Criar o helper `statusPt()` em escala global e aplicar nos componentes genéricos de UI (V2Badge, etc).

## 12. Roadmap de correção

### Sprint 1 — Corrigir modelo de papéis e navegação (P0)
- Inserir botão de Logout (`useAuth().logout()`) na interface Desktop do Admin/Mentor.
- Matar a rota `/mentor/*` temporariamente (remover do AppRouter ou ocultar), transferindo `MentorCheckins` para `/admin/checkins`.
- Ocultar `workspaces`.

### Sprint 2 — Admin operador completo (P0) - CONCLUÍDO
- [x] Expandir `/admin/users/:id` para se tornar um "Prontuário do Aluno", permitindo ler todo o histórico dele (timeline de check-ins diários, fotos do corpo).
- [x] Adicionar seletor simples que atualize `profile.selectedWorkoutId` e `profile.selectedDietId` a partir da lista de catálogos do Admin.
- [x] Implementar fluxo operacional de revisão de check-ins (`/admin/checkins`).

### Sprint 3 — Check-ins funcionais (P1) - CONCLUÍDO
- [x] Permitir que o Admin responda / avalie (aprovar/recusar) um check-in enviado.
- [x] Criar a aba `/admin/checkins` para centralizar a fila de atenção imediata.
- [x] Aluno visualiza o feedback na própria interface.

### Sprint 4 — PT-BR e limpeza final (P2)
- Limpeza de traduções.

## 13. Veredito final

**Produto desalinhado: precisa corrigir papéis e operação antes de beta**

---
*A tese de que o Expert Club tentou herdar o "Expert Coaching SaaS" está 100% comprovada no código. O aplicativo hoje é impossível de ser operado pelo Ruben como treinador B2C sem estas correções cruciais de rotas e perfis.*
