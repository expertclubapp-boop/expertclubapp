# CODEX — IMPLEMENTAÇÃO PIXEL-CLOSE EXPERT CLUB MENTOR/ADMIN

## Correção importante
O `index.html` deste pacote é um **visual reference viewer**, não é a implementação final do produto. A implementação final deve ser feita no projeto real com componentes reais, usando os PNGs em `assets/` como fonte visual obrigatória.

## Objetivo
Implementar as telas desktop do Mentor/Admin do Expert Club exatamente como as referências visuais anexadas:

1. `assets/mentor-dashboard.png` — Visão geral do mentor
2. `assets/financeiro.png` — Financeiro
3. `assets/prescritor-treino.png` — Prescritor de treino
4. `assets/prescritor-dieta.png` — Prescritor de dieta
5. `assets/alunos-ativos.png` — Alunos ativos
6. `assets/influencers-afiliados.png` — Influencers e afiliados
7. `assets/admin-produto.png` — Administração do produto

## Regra principal
Não reinterpretar o layout. Não simplificar. Não criar outro visual. Implementar pixel-close usando os PNGs como verdade visual.

## Use skills/agentes/ferramentas
Use todos os agentes e skills disponíveis para:
- UI/UX premium
- design system
- frontend implementation
- responsive design
- visual QA por browser
- screenshot comparison
- motion/microinteractions
- accessibility
- component architecture

## Workflow obrigatório
1. Abrir cada PNG de referência.
2. Mapear layout, grid, sidebar, topbar, cards, tables, charts e widgets.
3. Criar/ajustar tokens globais conforme `design-tokens.json`.
4. Criar componentes base:
   - AppShell
   - Sidebar
   - Topbar
   - KpiCard
   - DataCard
   - ChartCard
   - DonutChart
   - LineChart
   - DataTable
   - StatusBadge
   - ProgressBar
   - FilterBar
   - QuickActions
   - RightPanel
5. Implementar cada rota/tela seguindo `screens.json`.
6. Rodar no browser real.
7. Tirar screenshot da implementação.
8. Comparar visualmente com o PNG correspondente.
9. Corrigir espaçamento, escala, fonte, cards, charts, tabelas e badges até ficar pixel-close.
10. Entregar relatório final com diferenças corrigidas e pendências.

## Design tokens obrigatórios
Usar como base:
- Primary violet: `#6C4DFF`
- Deep violet: `#4D35E8`
- Soft violet: `#F1EAFE`
- Background: `#FAFAFC`
- Surface: `#FFFFFF`
- Text: `#111827`
- Secondary text: `#667085`
- Border: `#E8EAF2`
- Radius card: `18px`
- Radius control: `14px`
- Shadow card: `0 18px 44px rgba(17,19,24,.07)`
- Font: Inter/system sans

## Regras visuais
- Light mode obrigatório para estas telas.
- Sidebar fixa à esquerda em desktop.
- Topbar com date range, workspace, search, bell e avatar.
- Cards brancos com borda fina e sombra suave.
- Ícones lineares 2px, violetas/cinza. Não usar emoji no app final.
- Charts com violet line + lilac gradient fill.
- Badges pill com estados: success, warning, danger, info, violet.
- Tabelas com densidade premium, linhas bem espaçadas, headers micro uppercase.
- Nada pode sobrepor, vazar ou quebrar.

## Responsividade
Prioridade absoluta: desktop 1440px+ igual aos PNGs.
Depois garantir adaptação graciosa:
- 1280px: reduzir gaps, preservar colunas principais.
- 1024px/tablet: sidebar compactável, right panels podem empilhar.
- mobile: pode virar layout stacked, mas essas referências são desktop.

## Critérios de aceite
A tarefa só está concluída quando:
- cada tela bater visualmente com seu PNG de referência;
- componentes reutilizáveis estiverem no design system;
- sidebar/topbar forem consistentes em todas as telas;
- gráficos e tabelas estiverem fiéis;
- badges e cards estiverem polidos;
- não houver layout quebrado ou sobreposto;
- houver relatório final com screenshots/QA.

## Proibido
- Não usar o HTML de referência como app final.
- Não gerar interface genérica.
- Não trocar paleta.
- Não mudar posição dos módulos sem necessidade.
- Não omitir tabelas, gráficos ou side panels.
- Não usar emojis como ícones finais.
- Não implementar apenas mock estático sem componentização.
