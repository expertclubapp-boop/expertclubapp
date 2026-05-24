# Expert Club - Audit Report Addendum

## Ajuste de regua

`expertcoaching-b91e2` permanece formalizado como ambiente unico de pre-lancamento / QA controlado enquanto nao houver usuarios reais, pagamento real ou dados reais de clientes.

Separar staging/production continua sendo gate antes de usuario real, mas nao e P0 imediato para esta PR de QA interno controlado.

## Decisao affiliate/subscription

Afiliado nao e aluno premium e nao bypassa subscription gate para acessar area de aluno.

Afiliado pode acessar:

- propria area/portal de afiliado;
- propria `affiliateAccount`;
- proprio `affiliateDashboard`, incluindo metricas agregadas permitidas para o proprio codigo.

Afiliado nao pode acessar:

- dados privados de aluno fora do escopo;
- colecoes do app de aluno protegidas por assinatura;
- conteudos premium apenas por ter role `affiliate`, mesmo se existir subscription ativa por engano.

Implementacao:

- `firestore.rules`: `canUseStudentApp()` passou a exigir `isMember()` com subscription ativa.
- `firestore.rules`: affiliate pode listar somente a propria `affiliateAccount` por `uid` e ler o proprio `affiliateDashboard` ativo.
- Guards frontend ja tratavam subscription gate apenas para `member`; fluxo de affiliate segue para `/affiliate/dashboard`.

## Actionability cleanup

Itens fechados:

- placeholder `5511999999999` removido/desabilitado na lock screen e landing;
- `href="#"` removido da comunidade;
- `console.log` removido do app e de function de notificacao em producao;
- `alert()`/`window.confirm()` nativos restantes em rotas ativas substituidos por toasts ou confirmacao inline existente;
- mock hardcoded `Opção A/B` removido de `/app/diets/today`.

## Veredito

Critical cleanup validado para QA interno controlado.

Nao declarar Beta externo, Production Ready ou pronto para escala a partir desta PR.
