# PROMPT FINAL PARA CODEX — IMPLEMENTAR EXPERT CLUB 100% FIEL ÀS TELAS DE REFERÊNCIA

## MISSÃO

Você é o agente responsável por fazer o polish visual completo do **Expert Club**. O objetivo não é criar uma interpretação nova. O objetivo é **replicar com altíssima fidelidade** as telas anexadas como referência visual, convertendo-as em componentes reais, responsivos, limpos, reutilizáveis e prontos para produção.

**Não invente outro visual. Não mude layout, cor, proporção, hierarquia, copy, botões, cards, gráficos, espaçamentos ou estilo.** As imagens anexadas são a direção final.

A implementação deve usar todos os recursos disponíveis no ambiente: skills, agentes, browser visual QA, UI/UX review, design-system review, accessibility review, frontend implementation review, screenshot comparison e qualquer agente/ferramenta útil para chegar no resultado mais próximo possível das referências.

---

## REFERÊNCIAS OBRIGATÓRIAS

Use os anexos/imagens como fonte visual principal:

1. `01-brandbook-design-system.png`  
   Brandbook + Design System do Expert Club.

2. `02-ux-blueprint.png`  
   UX Blueprint, arquitetura, jornadas e módulos.

3. `03-landing-page.png`  
   Landing page light-first do Expert Club.

4. `04-student-dashboard.png`  
   Dashboard do aluno.

5. `05-mentor-dashboard.png`  
   Dashboard do mentor.

Você deve abrir as imagens, analisar composição, grid, espaçamento, copy, estados visuais, cards, ícones, botões, gráficos, sombras, bordas e reproduzir o máximo possível dentro do projeto.

---

## REGRA DE OURO

A implementação deve ser **pixel-close** com as imagens.

Prioridade de fidelidade:

1. Layout e composição geral.
2. Hierarquia visual.
3. Cores, fundos, sombras, bordas e radius.
4. Tipografia, pesos e tamanhos.
5. Cards, botões, inputs, tabs, badges e progressos.
6. Gráficos, KPIs e tabelas.
7. Textos/copy exatamente como nas telas.
8. Ícones com mesma intenção visual.
9. Responsividade sem quebrar o visual desktop.
10. Animações sutis sem descaracterizar o design.

**Não substitua por componentes genéricos.** Se um componente existente estiver visualmente inferior, refatore.

---

## DIREÇÃO VISUAL

O Expert Club deve ser **light-first**.

### Visual principal

- Fundo off-white / branco quente.
- Cards brancos com borda sutil.
- Texto carvão/grafite.
- Acento violeta elétrico.
- Lilás suave para superfícies secundárias.
- Mint/verde apenas para estados positivos.
- Vermelho/rosa apenas para alerta/atenção.
- Interface feminina-friendly, limpa, leve, motivadora e premium.

### Evitar

- Dark dominante.
- Gradiente preto pesado com texto roxo.
- Visual genérico de dashboard.
- Cards sem respiro.
- Excesso de ruído visual.
- Layouts que pareçam gerados por IA.
- Componentes aleatórios que não aparecem nas referências.

---

## DESIGN TOKENS OBRIGATÓRIOS

Implemente tokens globais e substitua estilos soltos por variáveis.

### Cores

```css
--ec-violet: #6C4DFF;
--ec-violet-600: #5637F5;
--ec-violet-700: #4328D9;
--ec-lilac-50: #FAF8FF;
--ec-lilac-100: #F1EAFE;
--ec-lilac-200: #E9E3FF;
--ec-mint-50: #E9F7F1;
--ec-mint-500: #22C55E;
--ec-amber-500: #F59E0B;
--ec-danger-500: #EF4444;
--ec-info-500: #3B82F6;
--ec-charcoal: #111318;
--ec-graphite: #2A2E36;
--ec-muted: #667085;
--ec-border: #E7E7EF;
--ec-offwhite: #FAFAFC;
--ec-white: #FFFFFF;
```

### Radius

```css
--radius-xs: 8px;
--radius-sm: 12px;
--radius-md: 16px;
--radius-lg: 20px;
--radius-xl: 24px;
--radius-2xl: 32px;
--radius-pill: 999px;
```

### Sombras

```css
--shadow-card: 0 18px 50px rgba(18, 18, 26, 0.06);
--shadow-float: 0 28px 80px rgba(108, 77, 255, 0.16);
--shadow-soft: 0 8px 24px rgba(17, 19, 24, 0.06);
```

### Tipografia

- Preferir `Inter` como fonte principal.
- Headings com peso 700/800.
- Body com peso 400/500.
- Labels pequenas com letter spacing sutil.

---

## TELAS A IMPLEMENTAR

### 1. Brandbook + Design System

Rota sugerida:

- `/design-system`
- ou página interna equivalente.

Deve reproduzir a imagem `01-brandbook-design-system.png`.

Blocos obrigatórios:

- Header com logo Expert Club.
- Título: `BRANDBOOK + DESIGN SYSTEM`.
- Subtítulo: `Expert Club by Expert Coaching`.
- Cards de modo light/dark.
- Logo usage.
- Paleta.
- Tipografia.
- Escala de espaçamento.
- Raio de borda.
- Componentes: botões, inputs, toggle/check/radio, tabs, badges/chips, barra de progresso.
- Widgets KPI.
- Gráfico.
- Iconografia.
- Preview do Dashboard do Aluno.
- Preview do Dashboard do Mentor.
- Princípios de UX.

### 2. UX Blueprint

Rota sugerida:

- `/ux-blueprint`

Deve reproduzir a imagem `02-ux-blueprint.png`.

Blocos obrigatórios:

- Título: `UX BLUEPRINT`.
- Subtítulo: `Arquitetura, jornadas e módulos principais`.
- Arquitetura do produto.
- Jornada do aluno.
- Jornada do mentor.
- Princípios de navegação.
- Blueprint das telas principais.
- Sistema de conteúdo.

### 3. Landing Page

Rota principal:

- `/`
- ou `/expert-club`

Deve reproduzir a imagem `03-landing-page.png`.

Estrutura obrigatória:

- Header com logo, nav e botões `Entrar` e `Começar agora`.
- Badge: `Seu app completo de fitness e bem-estar`.
- Hero:
  - `Sua rotina fitness, mais leve, clara e inteligente.`
  - Copy de suporte sobre treinos, dieta, check-ins, desafios, ranking e acompanhamento.
  - CTA primário `Começar agora`.
  - CTA secundário `Ver como funciona`.
- Mockups do app à direita.
- Stats strip:
  - `+ 48 mil alunas transformadas`
  - `+ 1,2 milhão treinos realizados`
  - `4,9 avaliação nas lojas`
  - `100% seguro e confiável`
- Feature cards:
  - Treinos
  - Dieta
  - Hidratação
  - Check-ins
  - Desafios
  - Ranking
- Testimonial.
- CTA final:
  - `Pronta para sua melhor versão?`
  - `Começar agora`
  - `Falar com um consultor`

### 4. Dashboard do Aluno

Rota sugerida:

- `/student/dashboard`
- `/dashboard/aluno`

Deve reproduzir a imagem `04-student-dashboard.png`.

Blocos obrigatórios:

- Sidebar com logo e menu:
  - Dashboard do Aluno
  - Treinos
  - Dieta
  - Hidratação
  - Check-ins
  - Evolução
  - Desafios
  - Mensagens
  - Relatórios
  - Configurações
- Card de convite: `Convide uma amiga`.
- Header:
  - `Olá, Mariana 👋`
  - `Seu foco de hoje constrói a sua melhor versão de amanhã.`
- Card `Plano de hoje`:
  - Treino do dia: `Treino A - Força`, `45 min`, `Intermediário`, botão `Iniciar treino`.
  - Dieta do dia: `Plano de hoje`, `2.100 kcal`, `Alta proteína`, botão `Ver dieta`.
  - Check-in do dia: `Check-in diário`, `Rápido • 2 min`, botão `Responder`.
- Streak: `12 dias seguidos`.
- Hidratação: `80% da meta`, botões `+250 ml`, `+500 ml`, `+750 ml`.
- Evolução da semana: `76% treinos concluídos`.
- Ranking: `Top 8%`, `2.450 XP`, `Nível 12`.
- Desafios ativos:
  - `Desafio 30 Dias de Foco`
  - `Desafio Hidratação`
- Agenda.
- Próximo check-in.
- Cards: Sequência, Sono, Bem-estar, Energia.

### 5. Dashboard do Mentor

Rota sugerida:

- `/mentor/dashboard`
- `/dashboard/mentor`

Deve reproduzir a imagem `05-mentor-dashboard.png`.

Blocos obrigatórios:

- Sidebar com logo e menu:
  - Visão geral
  - Alunos
  - Check-ins
  - Treinos
  - Planos
  - Mensagens
  - Relatórios
  - Alertas
  - Configurações
- Header:
  - `Visão geral`
  - `Olá, Rodrigo! Aqui está o resumo do seu acompanhamento.`
  - Filtro de período: `12 mai – 18 mai, 2024`
  - Filtro: `Todos os alunos`
- KPI cards:
  - `Alunos ativos` — `28`
  - `Check-ins pendentes` — `8`
  - `Adesão média` — `85%`
  - `Treinos concluídos` — `156`
  - `Evolução média` — `+4,8%`
  - `Satisfação` — `4,8/5`
- Gráfico: `Adesão dos alunos ao longo do tempo`.
- Alertas com alunos:
  - Ana Carolina Silva
  - Lucas Almeida
  - Mariana Costa
- Ações rápidas:
  - `Revisar check-ins`
  - `Atualizar planos`
- Tabela: `Atividade recente dos alunos`.
- Ranking de engajamento.
- Cards laterais:
  - Hidratação média
  - Frequência no app
  - Conclusão de treinos
- Banner `Dica do mentor`.

---

## COMPONENTES QUE DEVEM SER CRIADOS/REFATORADOS

Crie componentes reutilizáveis, sem duplicação excessiva:

- `ExpertLogo`
- `AppShell`
- `Sidebar`
- `NavItem`
- `Button`
- `Card`
- `KpiCard`
- `ProgressRing`
- `MiniSparkline`
- `MetricBarChart`
- `LineAreaChart`
- `Badge`
- `Chip`
- `Tabs`
- `Input`
- `Toggle`
- `DashboardHeader`
- `StudentTodayPlanCard`
- `HydrationCard`
- `RankingCard`
- `ChallengeCard`
- `MentorAlertsCard`
- `RecentActivityTable`
- `EngagementRankingCard`
- `FeatureCard`
- `HeroMockup`

Use nomes compatíveis com a stack atual do projeto.

---

## GRÁFICOS

Os gráficos precisam se parecer com as imagens.

Preferência:

- Se o projeto já usa Recharts, use Recharts.
- Caso contrário, implementar com SVG/CSS simples.
- Não usar gráficos crus sem styling.

Requisitos visuais:

- Linha violeta com área lilás translúcida.
- Eixos discretos.
- Labels pequenas.
- Barras violetas arredondadas.
- Sparklines minimalistas nos cards.
- Progress rings com stroke grosso, arredondado e gradiente violeta.

---

## ANIMAÇÕES E MICROINTERAÇÕES

Adicionar apenas animações sutis e premium:

- Hover em cards: leve elevação, borda violeta suave.
- Botões: translateY(-1px), shadow violet sutil.
- Entrada dos cards: fade + slide leve.
- Progress rings: animação de stroke.
- Gráficos: animação suave ao montar.

Não usar animações exageradas.

---

## ACESSIBILIDADE

Mesmo copiando o visual, manter:

- Contraste suficiente.
- Foco visível.
- Botões reais, não div clicável.
- Labels/aria-label quando necessário.
- Navegação por teclado.
- Sem texto minúsculo ilegível.

---

## RESPONSIVIDADE

A referência principal é desktop. Preserve desktop primeiro.

Depois adapte:

- Sidebar vira drawer ou nav compacta em mobile.
- Cards empilham verticalmente.
- Landing hero empilha texto e mockup.
- KPIs viram grid 2 colunas / 1 coluna.
- Tabelas podem virar cards em mobile.

Não destrua a fidelidade desktop para forçar mobile.

---

## PROCESSO OBRIGATÓRIO

1. Localize a stack, rotas e padrões atuais do projeto.
2. Abra e analise as imagens anexadas.
3. Crie/atualize tokens globais do Expert Club.
4. Crie componentes base.
5. Implemente as cinco telas.
6. Faça build/typecheck/testes.
7. Use browser visual QA para comparar com as imagens.
8. Ajuste espaçamentos, tamanhos, cores, cards e copy até ficar muito próximo.
9. Gere relatório final com:
   - arquivos alterados;
   - rotas implementadas;
   - componentes criados;
   - diferenças inevitáveis, se houver;
   - prints do browser real.

---

## CRITÉRIOS DE ACEITE

A entrega só está aprovada se:

- A landing parecer claramente igual à imagem 03.
- O dashboard do aluno parecer claramente igual à imagem 04.
- O dashboard do mentor parecer claramente igual à imagem 05.
- O brandbook/design system parecer igual à imagem 01.
- O UX blueprint parecer igual à imagem 02.
- A interface estiver light-first.
- Os textos principais estiverem iguais.
- Os cards, botões, gráficos e menus estiverem com estilo igual.
- Não houver regressões de build/typecheck.
- Não houver visual dark pesado nas telas principais.
- Não houver aparência genérica ou template.

---

## IMPORTANTE

Não trate as imagens como inspiração solta. Elas são a **especificação visual final**.

O resultado esperado é: **Expert Club com polish premium, clean, feminino-friendly, light-first, com layout e componentes praticamente iguais às telas anexadas.**
