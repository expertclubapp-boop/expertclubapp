# Expert Club — Billing Sandbox Validation

## Objetivo
Validar o fluxo comercial completo ponta a ponta (Checkout → Sandbox → Webhook → Subscription ativa) para garantir a viabilidade comercial do produto antes do lançamento do Beta com usuários reais.

## Veredito
**Parcial: billing sandbox ainda pendente**

## Matriz de Validação
| Fluxo | Existe? | Validado sandbox? | Resultado | Pendência |
|---|---|---|---|---|
| Criar checkout | Sim (`createMercadoPagoCheckout`) | Não | - | Inserir chaves Sandbox e testar UI (`/app/billing/plans`). |
| Abrir URL de pagamento | Sim | Não | - | - |
| Pagamento aprovado sandbox | Sim (lógica MP) | Não | - | Requer conta Sandbox MP. |
| Webhook recebido | Sim (`mercadoPagoWebhook`) | Não | - | Configurar e expor endpoint HTTPS para o MP disparar. |
| Webhook idempotente | Sim (`billingEvents`) | Avaliado em código | `BILLING_EVENTS` registra chaves idempotentes. | Teste de carga real com duplicatas. |
| Subscription criada/ativada | Sim | Avaliado em código | A rule e a function garantem a criação. | - |
| Member ativo acessa `/app/*` | Sim | Sim (Testes QA) | Acesso liberado no lock. | - |
| Member sem assinatura cai no lock | Sim | Sim (Testes QA) | Cai na tela `/app/billing/lock`. | - |
| Affiliate não acessa app premium | Sim | Sim (Testes QA) | Redirecionado corretamente. | - |
| Billing events registrados | Sim | Avaliado em código | Gera comissionamento no ledger. | - |

## Segurança

As validações de segurança em código demonstram robustez:
- **Assinatura HMAC:** A cloud function `mercadoPagoWebhook` valida o `x-signature` usando `MERCADO_PAGO_WEBHOOK_SECRET`.
- **Idempotência:** A chave do webhook é processada e armazenada na coleção `billingEvents` previnindo duplicações.
- **Client não-autorizado:** `firestore.rules` proíbe usuários de atualizarem sua própria assinatura, e limita a criação à `status == 'pending'` e provider `manual`. A transição para `active` requer ambiente admin/cloud functions.
- **Affiliate Bypass:** Testes com roles comprovam que afiliados não podem acessar `/app/*` (redirecionados para affiliate dashboard).

## Bloqueio para Beta
Sem o teste sandbox de ponta a ponta finalizado com sucesso no Mercado Pago, **é comercialmente inseguro** declarar o sistema pronto para usuários pagantes. O beta real continua condicionado à configuração do sandbox e à decisão definitiva sobre o Firebase Environment.
