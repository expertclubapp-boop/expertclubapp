# Expert Club - Operational Smoke Test

Projeto Firebase alvo: `expertcoaching-b91e2`.

Status: projeto tratado como ambiente unico de pre-lancamento / QA controlado, confirmado pelo owner enquanto nao houver usuarios reais. Ver `docs/firebase/FIREBASE_ENVIRONMENTS.md`.

## Setup de QA

O script `npm run smoke:setup` cria/atualiza:

- `admin@expertclub.com` como owner/admin.
- `influencer@expertclub.com` como afiliada vinculada ao codigo `MARI384`.
- `aluno.ativo@expertclub.com` como aluno ativo com assinatura `active`.
- `aluno.bloqueado@expertclub.com` como aluno bloqueado com assinatura `past_due`.
- Plano fundador, treino, dieta, conteudo, desafio, comunidade, atribuicao e comissao demo.

Antes de rodar em projeto real, configure credencial Admin SDK:

```powershell
gcloud auth application-default login
gcloud config set project expertcoaching-b91e2
$env:SMOKE_TEST_PASSWORD="use-uma-senha-temporaria-forte"
$env:EXPERT_CLUB_FIREBASE_ENV="staging"
npm run smoke:setup
```

Para validar sem escrever dados:

```powershell
npm run smoke:setup:dry
```

## Roteiro manual de smoke

1. Landing/afiliado:
   - Abrir `/?ref=MARI384&hero=B&utm_source=affiliate&utm_campaign=stories`.
   - Confirmar badge de convite, Hero B e CTA preservando `ref`, `utm_source`, `utm_campaign`.
   - Abrir `/affiliate/MARI384` e confirmar link publico da afiliada.

2. Auth:
   - Criar uma conta nova por email/senha.
   - Entrar por email/senha.
   - Testar erro com senha errada.
   - Testar `/reset-password`.
   - Entrar com Google.

3. Aluno ativo:
   - Login com `aluno.ativo@expertclub.com`.
   - Validar `/app/today`, `/app/workouts`, detalhe de treino, inicio de sessao, logs de serie, finalizar treino.
   - Validar `/app/diets`, detalhe de dieta, `/app/hydration`, check-in diario, check-in semanal, evolucao, desafios, conteudos, comunidade e billing.

4. Aluno bloqueado:
   - Login com `aluno.bloqueado@expertclub.com`.
   - Acessar `/app/today`, `/app/workouts`, `/app/content`, `/app/checkin/daily`, `/app/checkin/weekly` e `/app/workouts/session/teste`.
   - Todos os caminhos premium devem redirecionar para `/app/billing/lock`.
   - `/app/billing/plans` deve continuar acessivel.

5. Admin:
   - Login com `admin@expertclub.com`.
   - Abrir `/admin/subscriptions`, alterar status manualmente e confirmar audit log.
   - Abrir `/admin/affiliates`, criar afiliada e gerar codigo.
   - Abrir `/admin/commissions`, selecionar comissao aprovada e criar payout.

## Breakpoints

Validar sem overflow horizontal e sem erro de console em:

- 375px
- 390px
- 430px
- 768px
- 1024px
- 1440px

## Observacoes

- O webhook do Mercado Pago agora exige `MERCADO_PAGO_WEBHOOK_SECRET`; sem esse secret, notificacoes sao rejeitadas.
- O script de smoke usa Admin SDK e nao deve ser exposto para usuario final.
- A senha dos usuarios de QA nao fica versionada; use `SMOKE_TEST_PASSWORD` localmente.
- O script recusa ambiente marcado como `production` e exige confirmacao explicita para escrever em `expertcoaching-b91e2`.
