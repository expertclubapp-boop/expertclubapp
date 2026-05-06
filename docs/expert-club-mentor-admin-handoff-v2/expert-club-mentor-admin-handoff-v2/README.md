# Expert Club Mentor/Admin Handoff V2

Este pacote corrige o problema do protótipo anterior: o `index.html` agora é um **viewer de referência visual**, não uma tentativa imprecisa de recriar todas as telas manualmente.

## Arquivos
- `index.html` — viewer com as telas PNG aprovadas.
- `styles.css` — estilos do viewer e tokens visuais de apoio.
- `design-tokens.json` — tokens oficiais para implementação.
- `screens.json` — blueprint das rotas, módulos e critérios de aceite.
- `CODEX_IMPLEMENTATION_PROMPT_V2.md` — prompt para o Codex implementar pixel-close.
- `assets/*.png` — fonte visual obrigatória.

## Como usar no Codex
1. Suba este ZIP.
2. Suba o projeto atual.
3. Cole o conteúdo de `CODEX_IMPLEMENTATION_PROMPT_V2.md`.
4. Peça para o Codex abrir `assets/*.png` e usar visual QA/screenshot comparison.
5. O app final deve ser componentizado, não uma cópia do `index.html`.
