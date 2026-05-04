# Expert Club — Design System v2.0
> Versão corrigida pós-auditoria. Fonte da verdade para desenvolvimento.  
> Purple token corrigido: `#6750A4` → `#8B5CF6`. Sem dependência de Material You.

---

## 1. Identidade Visual

**Expert Club** é uma plataforma de fitness premium de alta performance. O design segue o princípio **dark fitness-tech**: fundo profundo, tipografia forte, acento vetorizados em cores saturadas. Sem gradientes pastel, sem estética genérica SaaS, sem Material You.

**Princípios:**
- Dark-first, mobile-first
- Informação densa sem poluição visual
- Hierarquia clara: um foco por card
- Cor como sinal, não decoração
- Movimento discreto, responsivo ao toque

---

## 2. Paleta de Cores

### Backgrounds
```
--bg-primary:      #07080A   /* Fundo raiz de toda a aplicação */
--bg-secondary:    #0D0F14   /* Superfície principal de cards e nav */
--surface-1:       #12151C   /* Cards elevados, modais */
--surface-2:       #181C24   /* Cards aninhados, inputs, chips selecionados */
--surface-3:       #1E2230   /* Hover states, destaque sutil */
```

### Acento — Lime (principal)
```
--accent-lime:         #B7FF3C   /* CTAs primários, badges ativos, streaks */
--accent-lime-dim:     rgba(183,255,60,0.12)   /* Backgrounds de elementos lime */
--accent-lime-border:  rgba(183,255,60,0.22)   /* Bordas de elementos lime */
--accent-lime-glow:    rgba(183,255,60,0.08)   /* Glow sutil em cards hero */
--on-lime:             #07080A   /* Texto sobre fundo lime */
```

### Acento — Sky (dados, hidratação)
```
--accent-sky:          #5DDCFF   /* Proteínas, hidratação, links, focus rings */
--accent-sky-dim:      rgba(93,220,255,0.10)
--accent-sky-border:   rgba(93,220,255,0.20)
--accent-sky-glow:     rgba(93,220,255,0.06)
```

### Acento — Purple (XP, nível, conquistas)
```
--accent-purple:       #8B5CF6   /* XP, level badges, conquistas, highlights */
--accent-purple-dim:   rgba(139,92,246,0.10)
--accent-purple-border:rgba(139,92,246,0.20)
--accent-purple-glow:  rgba(139,92,246,0.06)
--accent-purple-light: #C4B5FD   /* Texto sobre fundo purple-dim */
```

### Semânticas
```
--accent-green:    #22C55E   /* Sucesso, meta batida */
--accent-red:      #FF3B3B   /* Erro, assinatura vencida, alerta crítico */
--accent-yellow:   #FACC15   /* Aviso, assinatura pendente */
--accent-orange:   #F97316   /* Gorduras no macros */
```

### Texto
```
--text-primary:    #F5F7FA   /* Títulos, valores principais */
--text-secondary:  #A8B0BD   /* Subtítulos, descrições */
--text-muted:      #707987   /* Labels, metadados, placeholders */
--text-disabled:   #3D4455   /* Estados desabilitados */
```

### Bordas
```
--border-subtle:   rgba(255,255,255,0.07)   /* Bordas padrão de cards */
--border-medium:   rgba(255,255,255,0.12)   /* Bordas de inputs e botões ghost */
--border-strong:   rgba(255,255,255,0.20)   /* Bordas de elementos em destaque */
```

---

## 3. Tipografia

### Fontes
```
Display / Headlines:  Space Grotesk (weights: 500, 600, 700, 900)
Body / UI:            Inter (weights: 400, 500, 600, 700)
```

### Escala tipográfica
| Token       | Font          | Size | Weight | Line-height | Letter-spacing |
|-------------|---------------|------|--------|-------------|----------------|
| display-xl  | Space Grotesk | 64px | 700    | 1.05        | -0.04em        |
| h1          | Space Grotesk | 40px | 700    | 1.2         | -0.02em        |
| h2          | Space Grotesk | 32px | 600    | 1.3         | -0.01em        |
| h3          | Space Grotesk | 24px | 600    | 1.4         | 0              |
| body-lg     | Inter         | 18px | 400    | 1.6         | 0              |
| body-md     | Inter         | 16px | 400    | 1.6         | 0              |
| body-sm     | Inter         | 14px | 400    | 1.5         | 0              |
| ui-label    | Inter         | 12px | 600    | 1           | 0.08em         |
| ui-label-lg | Inter         | 14px | 600    | 1           | 0.05em         |
| code-data   | Inter         | 12px | 700    | 1           | 0.05em         |
| micro       | Space Grotesk | 10px | 700    | 1           | 0.12em         |

Labels de seção e badges usam `text-transform: uppercase` + tracking aumentado.

---

## 4. Espaçamento

Sistema 4px base:
```
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px    /* base unit */
--space-5:   20px    /* gutter mobile */
--space-6:   24px    /* padding interno de cards */
--space-8:   32px    /* seções */
--space-10:  40px
--space-12:  48px
--space-16:  64px
```

**Gutter lateral mobile:** 16–20px  
**Gap entre cards:** 10–12px  
**Padding interno de cards:** 20–24px  
**Padding de botões:** 14–16px vertical, 20–24px horizontal  

---

## 5. Border Radius

```
--radius-xs:    6px    /* Chips internos, badges */
--radius-sm:    8px    /* Botões pequenos, ícone-buttons */
--radius-md:    10px   /* Inputs, botões padrão */
--radius-lg:    14px   /* Cards menores, pills */
--radius-card:  20px   /* Cards padrão */
--radius-shell: 28px   /* Modais, overlays grandes */
--radius-full:  9999px /* Avatares, progress rings, pills */
```

---

## 6. Sombras e Glows

```css
/* Cards com acento */
.glow-lime    { box-shadow: 0 0 40px rgba(183,255,60,0.08); }
.glow-sky     { box-shadow: 0 0 40px rgba(93,220,255,0.07); }
.glow-purple  { box-shadow: 0 0 40px rgba(139,92,246,0.07); }

/* Glows ambiente (background decorativo) */
.ambient-lime { width:400px; height:400px; background:rgba(183,255,60,0.04); filter:blur(120px); border-radius:50%; }
.ambient-sky  { width:350px; height:350px; background:rgba(93,220,255,0.04); filter:blur(100px); border-radius:50%; }

/* Sombra de cards elevados */
.shadow-card  { box-shadow: 0 4px 24px rgba(0,0,0,0.40); }

/* Barra de navegação */
.shadow-nav   { box-shadow: 0 -1px 0 rgba(255,255,255,0.06), 0 -8px 32px rgba(0,0,0,0.50); }
```

---

## 7. Componentes

### 7.1 Cards

**Card padrão:**
```css
background: #12151C;
border: 1px solid rgba(255,255,255,0.08);
border-radius: 20px;
padding: 20px;
```

**Card glass (overlays, login):**
```css
background: rgba(18,21,28,0.80);
backdrop-filter: blur(24px);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 20px;
```

**Card com acento lime (hero):**
```css
border-color: rgba(183,255,60,0.15);
/* Adicionar glow-lime */
```

**Card dashed CTA (check-in):**
```css
border: 2px dashed rgba(183,255,60,0.20);
background: rgba(183,255,60,0.04);
border-radius: 20px;
```

---

### 7.2 Botões

**Primário — Lime:**
```css
background: #B7FF3C;
color: #07080A;
font-weight: 700;
font-size: 15px;
border-radius: 10px;
padding: 15px 24px;
border: none;
/* Hover: opacity 0.92 */
/* Active: scale(0.97) */
```

**Secundário — Ghost:**
```css
background: transparent;
border: 1px solid rgba(255,255,255,0.12);
color: #F5F7FA;
font-weight: 600;
font-size: 14px;
border-radius: 10px;
padding: 14px 24px;
/* Hover: background rgba(255,255,255,0.05) */
```

**Destrutivo:**
```css
background: rgba(255,59,59,0.08);
border: 1px solid rgba(255,59,59,0.20);
color: #FF3B3B;
font-weight: 700;
border-radius: 14px;
/* Hover: rgba(255,59,59,0.14) */
```

**Google OAuth:**
```css
background: rgba(255,255,255,0.05);
border: 1px solid rgba(255,255,255,0.12);
color: #F5F7FA;
border-radius: 10px;
padding: 14px;
```

---

### 7.3 Chips / Pills

**Badge de acento:**
```css
padding: 4px 12px;
border-radius: 999px;
font-size: 11px;
font-weight: 700;
letter-spacing: 0.08em;
text-transform: uppercase;
/* Lime: bg rgba(183,255,60,0.10), border rgba(183,255,60,0.22), color #B7FF3C */
/* Sky:  bg rgba(93,220,255,0.10), border rgba(93,220,255,0.22), color #5DDCFF */
/* Purple: bg rgba(139,92,246,0.10), border rgba(139,92,246,0.22), color #8B5CF6 */
```

**Chip de filtro (libraries):**
```css
padding: 8px 16px;
border-radius: 999px;
font-size: 12px;
font-weight: 600;
background: rgba(255,255,255,0.05);
border: 1px solid rgba(255,255,255,0.08);
color: #A8B0BD;
/* Selected: background rgba(183,255,60,0.12), border rgba(183,255,60,0.25), color #B7FF3C */
```

**Chip de dificuldade (weekly check-in):**
```css
padding: 9px 16px;
border-radius: 999px;
font-size: 12px;
font-weight: 600;
/* Selected: sky palette */
```

---

### 7.4 Inputs

**Input padrão:**
```css
background: #07080A;
border: 1px solid rgba(255,255,255,0.10);
border-radius: 10px;
color: #F5F7FA;
padding: 13px 16px;
font-size: 15px;
font-family: Inter;
outline: none;
/* Focus: border-color #5DDCFF */
/* Placeholder: color #707987 */
```

**Input com ícone:** padding-left: 44px + ícone absoluto à esquerda.

**Textarea:** mesmo estilo, resize: none, line-height: 1.6.

**Range slider:**
```css
accent-color: #B7FF3C; /* ou #5DDCFF para escala sky */
width: 100%;
```

---

### 7.5 Barras de Progresso

**Linear (macros, hidratação):**
```css
height: 6px;
background: rgba(255,255,255,0.06);
border-radius: 999px;
overflow: hidden;
/* Fill: height 100%, border-radius 999px */
/* Lime fill: #B7FF3C */
/* Sky fill: #5DDCFF */
/* Red fill: rgba(255,59,59,0.70) (abaixo da meta) */
```

**Progress ring (hidratação):**
```
SVG círculo r=86 em viewBox 200x200.
stroke-dasharray: 540.35 (circunferência).
stroke-dashoffset: circunferência * (1 - percentual).
Transição: 0.8s cubic-bezier(0.4,0,0.2,1).
```

**Barra de progresso de tela (check-in semanal):**
```css
height: 3px;
background: rgba(255,255,255,0.05);
fill: linear-gradient(90deg, #B7FF3C, #5DDCFF);
```

---

### 7.6 Navegação inferior

5 tabs: Hoje, Treinos, Dietas, Evolução, Conteúdo (ou Perfil quando na tela de perfil).

```css
/* Container */
background: rgba(13,15,20,0.95);
backdrop-filter: blur(16px);
border-top: 1px solid rgba(255,255,255,0.08);
position: fixed; bottom: 0; left: 0; width: 100%;
padding: 10px 8px 12px;
display: flex; justify-content: space-around;

/* Item */
display: flex; flex-direction: column; align-items: center;
gap: 3px; padding: 6px 12px; border-radius: 12px;
font-size: 10px; font-family: 'Space Grotesk';
font-weight: 600; letter-spacing: 0.10em; text-transform: uppercase;
color: rgba(255,255,255,0.30);
transition: all 0.2s;

/* Item ativo */
color: #B7FF3C;
background: rgba(183,255,60,0.07);
```

---

### 7.7 Row buttons (listas de configuração)

```css
display: flex; align-items: center; gap: 14px;
padding: 13px 14px; border-radius: 12px;
cursor: pointer; transition: background 0.15s;
/* Hover: background rgba(255,255,255,0.04) */

/* Ícone */
width: 36px; height: 36px; border-radius: 10px;
display: flex; align-items: center; justify-content: center;

/* Label */
flex: 1; font-size: 14px; font-weight: 500; color: #F5F7FA;

/* Valor */
font-size: 13px; color: #707987;

/* Chevron */
color: rgba(255,255,255,0.20);
```

---

### 7.8 Toggle (switches)

```css
position: relative; display: inline-block; width: 44px; height: 24px;

.slider {
  position: absolute; cursor: pointer; inset: 0;
  background: rgba(255,255,255,0.12); border-radius: 999px;
  transition: 0.2s;
}
.slider::before {
  position: absolute; content: ""; height: 18px; width: 18px;
  left: 3px; bottom: 3px; background: #F5F7FA;
  border-radius: 50%; transition: 0.2s;
}
input:checked + .slider { background: #B7FF3C; }
input:checked + .slider::before { transform: translateX(20px); background: #07080A; }
```

---

### 7.9 Empty States

```
Ícone: Material Symbols Outlined, 48px, cor rgba(255,255,255,0.15)
Título: 16px, font-weight 600, color #A8B0BD
Descrição: 13px, color #707987, max-width 260px, text-align center
CTA (opcional): btn-lime ou btn-ghost

Padding: 48px 24px
Fundo: surface-1 ou transparente
```

---

### 7.10 Loading States

**Skeleton:**
```css
background: linear-gradient(90deg, #12151C 25%, #181C24 50%, #12151C 75%);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
border-radius: igual ao elemento;

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Spinner (ações de submit):**
```css
width: 20px; height: 20px;
border: 2px solid rgba(7,8,10,0.30);
border-top-color: #07080A;
border-radius: 50%;
animation: spin 0.7s linear infinite;
```

---

### 7.11 Error States

**Inline (input com erro):**
```css
border-color: rgba(255,59,59,0.50);
/* Mensagem abaixo: font-size 12px, color #FF3B3B */
```

**Toast / banner:**
```css
background: rgba(255,59,59,0.10);
border: 1px solid rgba(255,59,59,0.20);
border-radius: 12px;
padding: 12px 16px;
color: #FF3B3B;
font-size: 13px;
```

---

## 8. Motion Guidelines

- **Transições de botão:** 150ms ease — opacity e scale
- **Hover de cards:** 200ms ease — border-color
- **Modais/overlays:** 250ms ease-out — translateY(16px) + opacity 0 → 0
- **Barras de progresso:** 400–800ms cubic-bezier(0.4,0,0.2,1)
- **Progress ring:** 800ms cubic-bezier(0.4,0,0.2,1)
- **Skeleton shimmer:** 1.5s linear infinite
- **Streak badge pulse:** 2s ease-in-out infinite (opacity 0.6 → 1)
- **Nav tap:** scale(1.10) active, 300ms ease-out

**Princípio:** movimento indica resposta, não entretenimento. Nada acima de 400ms na UI principal.

---

## 9. Tokens React/Tailwind

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      "bg-primary":       "#07080A",
      "bg-secondary":     "#0D0F14",
      "surface-1":        "#12151C",
      "surface-2":        "#181C24",
      "accent-lime":      "#B7FF3C",
      "accent-sky":       "#5DDCFF",
      "accent-purple":    "#8B5CF6",
      "accent-purple-light": "#C4B5FD",
      "accent-green":     "#22C55E",
      "accent-red":       "#FF3B3B",
      "accent-yellow":    "#FACC15",
      "text-primary":     "#F5F7FA",
      "text-secondary":   "#A8B0BD",
      "text-muted":       "#707987",
    },
    borderRadius: {
      "card":   "20px",
      "shell":  "28px",
      "btn":    "10px",
    },
    fontFamily: {
      "display": ["Space Grotesk", "sans-serif"],
      "body":    ["Inter", "sans-serif"],
    },
  },
}
```

---

## 10. Checklist anti-regressão

Antes de qualquer merge, verificar:

- [ ] Nenhum uso de `#6750A4`, `#cfbcff`, `#141218` (Material You tokens)
- [ ] Fundo raiz é `#07080A` em todas as telas
- [ ] Purple badge/XP usa `#8B5CF6`, não variante Material
- [ ] CTAs primários são lime `#B7FF3C` com texto `#07080A`
- [ ] Fontes são Space Grotesk + Inter (sem Roboto, sem system-ui como primária)
- [ ] Bottom nav tem 5 tabs com labels em português (Hoje/Treinos/Dietas/Evolução/Conteúdo)
- [ ] Radius de cards: 20px; botões: 10px; shells: 28px

---

*Expert Club Design System v2.0 — Atualizado pós-auditoria de compliance. Gerado em 29/abr/2026.*
