# Expert Club — Firebase Environment Decision Record

## Decisao registrada

Project ID analisado:

`expertcoaching-b91e2`

## Pergunta de decisao

Este projeto Firebase e:

- [ ] dev
- [x] ambiente unico de pre-lancamento / QA controlado
- [ ] staging/QA separado
- [ ] production com usuarios reais

## Responsavel pela confirmacao

Nome: Ruben

Cargo/funcao: Owner / responsavel pelo projeto

Data: 2026-05-07

## Evidencias verificadas

- [ ] Firebase Console acessado
- [ ] Organizacao/conta proprietaria conferida
- [ ] Billing conferido
- [ ] Usuarios reais conferidos
- [ ] Firestore/Storage com dados reais conferidos
- [ ] Dominios autorizados conferidos
- [ ] Apps Web/iOS/Android conectados conferidos
- [x] Firebase Hosting conferido
- [x] Hosting oficial identificado fora do Firebase
- [ ] Functions conferidas
- [ ] Regras atuais conferidas
- [ ] Historico de deploy conferido

## Hosting

- [x] Firebase Hosting conferido
- [x] Hosting oficial identificado fora do Firebase

Resultado:

O projeto Expert Club esta hospedado na Vercel. Firebase Hosting nao e o hosting oficial do frontend.

Implicacao:

A presenca ou ausencia de Firebase Hosting nao deve ser usada como criterio principal para classificar `expertcoaching-b91e2` como staging/QA ou production. A validacao de ambiente deve focar em Auth, Firestore, Storage, Functions, Billing, webhooks, dados reais e variaveis da Vercel.

## Authentication providers

- [x] Email/senha ativado
- [x] Google ativado

Leitura:

O projeto tem provedores de login reais habilitados. Isso confirma que o ambiente esta funcional para autenticacao, mas nao prova sozinho se e staging/QA ou production.

## Decisao atualizada

- [ ] dev
- [x] ambiente unico de pre-lancamento / QA controlado
- [ ] staging/QA separado
- [ ] production com usuarios reais

## Justificativa

O app ainda nao foi lancado publicamente.

No momento da decisao:

- Nao ha usuarios finais reais usando o app.
- Nao ha operacao comercial ativa no app.
- Nao ha dados reais de alunos/clientes que precisem ser preservados como producao.
- A Vercel Production aponta para `expertcoaching-b91e2`, mas esse deploy ainda e producao tecnica pre-lancamento, nao producao com trafego real.

## Evidencias de QA/pre-lancamento

- Usuarios QA `@expertclub.test` existem no Authentication.
- Firestore contem dados de smoke/QA como `mari_smoke`.
- Storage esta vazio.
- Firebase Hosting nao e hosting oficial do frontend; frontend esta na Vercel.
- Scripts do repo usam `expertcoaching-b91e2` como QA provavel com guardrails.

Leitura atual:

Essas evidencias sustentam a decisao de tratar `expertcoaching-b91e2` como ambiente unico de pre-lancamento / QA controlado enquanto nao houver usuarios reais, pagamento real ou dados reais de clientes.

## Evidencias ainda pendentes

- Billing/usage.
- Classificacao dos usuarios Gmail no Auth.
- Confirmacao se Functions recebem webhooks reais.

## Vercel Environment Variables

- [x] Vercel Project Settings conferido
- [x] Variaveis Firebase estao configuradas para Production and Preview
- [x] `VITE_FIREBASE_PROJECT_ID` verificado

Resultado:

As variaveis Firebase `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` e `VITE_FIREBASE_APP_ID` existem no projeto Vercel e estao disponiveis para Production and Preview.

`VITE_ENABLE_DEV_SEED` foi removida/restringida de Production na Vercel. Isso reduz ruído operacional e evita expor flag de seed/dev no client bundle de Production.

Leitura:

Variaveis com prefixo `VITE_` sao expostas ao client bundle pelo Vite. Chaves Firebase Web podem existir no cliente, mas flags de seed/dev nao devem habilitar fluxo de seed no client ou em producao.

Leitura de risco:

`VITE_FIREBASE_PROJECT_ID` em Vercel Production aponta para `expertcoaching-b91e2`. Como nao ha usuarios reais, este projeto fica classificado como producao tecnica pre-lancamento / QA controlado, nao como production com usuarios reais.

## Vercel Environment Check

Projeto Vercel: `expertclubapp`

Production domain: PENDENTE

Environment variables:

| Ambiente Vercel | VITE_FIREBASE_PROJECT_ID | Observacao |
|---|---|---|
| Production | expertcoaching-b91e2 | Production usa este Firebase |
| Preview | expertcoaching-b91e2 | Preview usa este Firebase |
| Development | Nao configurado nesta variavel | Desenvolvimento nao marcado |

Resultado:

- [x] Vercel Production aponta para `expertcoaching-b91e2`
- [ ] Apenas Preview/Development apontam para `expertcoaching-b91e2`
- [ ] Outro projectId e usado em Production

Como Vercel Production aponta para `expertcoaching-b91e2`, este Firebase deve ser reclassificado imediatamente quando houver usuario real, pagamento real ou dado real de cliente.

## Consequencia

Enquanto o app estiver em pre-lancamento:

- `expertcoaching-b91e2` pode ser usado para QA interno controlado.
- Seeds/smoke/rules podem ser executados com confirmacao explicita.
- Nao deve ser chamado de Production Ready.
- Nao deve ser usado para Beta externo sem nova decisao.
- Antes de convidar usuarios reais, sera obrigatorio decidir a estrategia final de ambientes.

## Gate antes de usuarios reais

Antes de lancar para usuarios reais, escolher uma das opcoes:

- [ ] manter `expertcoaching-b91e2` como producao oficial e criar novo staging/QA
- [ ] manter `expertcoaching-b91e2` como staging/QA e criar novo production
- [ ] criar dev/staging/production separados

Regra:

Enquanto nao houver usuarios reais, `expertcoaching-b91e2` pode ser usado como ambiente unico de pre-lancamento/QA. No momento em que entrar usuario real, pagamento real ou dado real de cliente, esse projeto deve ser congelado como producao ou separado de QA imediatamente.

## Proximas opcoes

### Opcao A — Manter `expertcoaching-b91e2` como producao oficial antes de usuarios reais

Criar um novo Firebase para staging/QA, por exemplo:

- `expertclub-staging`
- `expertclub-qa`
- `expertclub-dev`

Depois:

- Atualizar `.firebaserc`.
- Atualizar `.env.local`.
- Atualizar Vercel Preview para apontar para staging.
- Manter Vercel Production apontando para `expertcoaching-b91e2`.
- Rodar seeds apenas no staging.
- Rodar smoke no staging.
- Fazer deploy de rules primeiro no staging.

### Opcao B — Manter `expertcoaching-b91e2` como staging/QA e criar production

Criar um novo Firebase production antes de convidar usuarios reais e apontar Vercel Production para ele.

## Acao imediata na Vercel

Remover `VITE_ENABLE_DEV_SEED` de Production.

- [x] `VITE_ENABLE_DEV_SEED` removida/restringida de Production.
- [ ] Criar/separar Firebase staging/QA.
- [ ] Apontar Vercel Preview para o Firebase staging/QA.

Manter `VITE_ENABLE_DEV_SEED` no maximo em Preview/Development, ou remover completamente se seed ja e feito via scripts Admin SDK.

Plano operacional: `docs/firebase/FIREBASE_STAGING_QA_SETUP.md`.

## Resultado

- [x] Manter `expertcoaching-b91e2` como ambiente unico de pre-lancamento / QA controlado
- [ ] Tratar `expertcoaching-b91e2` como production com usuarios reais
- [ ] Criar novo projeto staging/QA e migrar QA para ele

## Consequencias da decisao

### Enquanto for pre-lancamento / QA controlado

- Atualizar `docs/firebase/FIREBASE_ENVIRONMENTS.md`
- Manter seeds QA permitidos apenas com confirmacao explicita
- Manter deploy de rules permitido apenas com validacoes
- Registrar production real como pendente
- Reavaliar antes de usuarios reais, pagamento real ou dados reais de clientes

### Se for production

- Suspender seeds QA
- Revisar usuarios QA ja criados
- Revisar deploys de rules ja feitos
- Criar projeto staging/QA separado
- Atualizar `.firebaserc`, `.env.local`, `.env.example` e scripts
- Nao convidar testers ate separar ambientes

### Se for criado novo staging/QA

- Criar projeto Firebase novo
- Atualizar `.firebaserc`
- Atualizar envs
- Rodar seeds no novo projeto
- Deployar rules no novo projeto
- Rodar `npm run test:rules`
- Rodar smoke completo
- Validar browser com usuarios reais de QA

## Assinatura

Responsavel: Ruben

Data: 2026-05-07

Observacoes: Decisao de pre-lancamento. Requer nova decisao antes de usuarios reais.

## Regra de gate

Sem nova decisao formal antes de usuarios reais, nao existe proximo gate confiavel.

Rollback, indices, Beta externo e release publico dependem da mesma premissa: saber se `expertcoaching-b91e2` sera congelado como producao ou se QA sera separado.
