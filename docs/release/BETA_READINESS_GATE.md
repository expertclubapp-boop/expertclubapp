# Expert Club — Beta Readiness Gate

## Veredito
QA interno mantido, beta real bloqueado

## Ambiente
| Decisão | Consequência |
|---|---|
| **Opção A:** `expertcoaching-b91e2` vira produção | Parar seeds destrutivos; congelar como ambiente real; criar staging/QA separado; Vercel Production continua apontando para ele; Vercel Preview para staging. |
| **Opção B:** `expertcoaching-b91e2` continua QA | Criar novo Firebase production; apontar Vercel Production; migrar configs; revalidar tudo. |
| **Opção C:** Manter único para beta restrito | Poucos usuários; sem pagamento real; consentimento de beta; backup; sem dados sensíveis; aprovação do owner. |

**Recomendação:** O Owner precisa registrar a decisão em `FIREBASE_ENVIRONMENT_DECISION_RECORD.md`.

## Billing
| Fluxo | Status | Pendência |
|---|---|---|
| criar checkout | Implementado (Cloud Function) | Validar com credenciais reais/sandbox. |
| retornar do checkout | Implementado | Validar callback na UI e delay do webhook. |
| webhook aprovado | Implementado (Idempotente) | Validar payload real do MP e HMAC signature. |
| ativar assinatura | Implementado | Validar fallback do `SubscriptionLockScreen`. |
| bloquear sem assinatura | PASS (Smoke Tests) | Nenhuma. |
| cancelar/expirar | Implementado | Validar status `cancelled` via webhook. |
| cupom | Implementado | Criar e testar cupons do MP. |
| wallet/referral | Implementado (Ledger) | Validar split de comissão para Affiliate. |

*O código das Cloud Functions e do Frontend está feito, mas nenhuma validação "ponta a ponta" com ambiente real ou sandbox de pagamentos ocorreu ainda. Isso bloqueia a liberação.*

## Usuários reais
| Critério | Status |
|---|---|
| Quantos usuários? | Indefinido |
| Quem são? | Indefinido |
| Terão pagamento real? | Indefinido |
| Terão dados reais de dieta/treino? | Indefinido |
| Quem aprova entrada? | Indefinido |
| Canal de suporte oficial? | Indefinido |
| Como reportar bug? | Indefinido |
| Como rollbackar? | `ROLLBACK_PLAN.md` pronto (Vercel) |
| Como remover usuário se der problema? | Indefinido |

*Sem respostas claras para os critérios do Beta, o avanço com usuários reais fica tecnicamente e operacionalmente bloqueado.*

## Performance
| Área | Status | Limite |
|---|---|---|
| `adminLaunchService` | OK para beta pequeno, NÃO para escala | `limit(1000)` assinaturas, `limit(500)` eventos. Coleções lidas inteiras até o limite. |
| `adminMetricsService` | OK para beta pequeno, NÃO para escala | `limit(1000)` usuários e pagamentos. `collectionGroup` restrito temporalmente. |
| `mentorDashboardService` | OK para beta pequeno, NÃO para escala | `limit(100)` alunos, `limit(30)` sessões. |
| Relatórios Agregados | Faltando | Backend não consolida métricas; frontend soma arrays retornados do Firestore. |

## Gaps antes de beta
| Prioridade | Gap | Correção |
|---|---|---|
| **P0** | **Decisão de Ambiente** | Escolher estrategicamente o destino de `expertcoaching-b91e2` antes de inserir 1 único usuário real. |
| **P0** | **Billing/Checkout Sandbox** | Inserir chaves Sandbox do Mercado Pago e simular fluxos de compra completos no dev local ou staging para validar a Cloud Function e Webhooks. |
| **P0** | **Definição de Beta** | Preencher a matriz de Usuários Reais com escopo, canais de suporte e política de expurgo de dados caso dê erro. |

## Gaps antes de escala
| Prioridade | Gap | Correção |
|---|---|---|
| **P1** | **Paginação e Server-side Aggregations** | Eliminar queries globais limitadas (ex: trazer 1000 `subscriptions` para somar MRR) e implementar Cloud Functions que mantêm contadores (`metrics/mrr`, `metrics/activeUsers`). |
| **P1** | **Separação Rígida de Ambientes** | Staging e Production precisam ser 2 projetos Firebase distintos com CI/CD garantindo isolamento total. |
