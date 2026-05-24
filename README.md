# Distinct Services — Landing Page

Site institucional / landing page de conversão da **Distinct Services**, automação operacional para lojistas multi-marketplace.

**Stack**: HTML + CSS + JS vanilla. GSAP + ScrollTrigger via CDN. Sem build step.

## Como rodar localmente

Como é estático, basta abrir `Landing Page.html` no navegador. Para evitar issues de CORS com fontes locais, recomendado servir via servidor HTTP simples:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Depois acesse `http://localhost:8080/Landing%20Page.html`.

## Estrutura

```
.
├── Landing Page.html        # Página única
├── assets/
│   ├── logo-1.svg            # Logo brand (favicon + footer)
│   ├── iS-mark.svg           # Brand mark
│   ├── og-image.svg          # Open Graph image (1200×630)
│   └── marketplaces/         # SVGs dos marketplaces
├── styles/
│   ├── tokens.css            # Design tokens (cores, fontes, spacing, eases)
│   ├── site.css              # Estilos de componente
│   └── fonts/                # TTFs locais (Inter, Montserrat Alternates, Montserrat)
└── scripts/
    └── site.js               # Comportamentos: hero canvas, GSAP, console feed, FAQ, clock
```

## Decisões de design

- **Aesthetic**: high-contrast modern SaaS — fundo dark `#0F0F0F`, primário verde `#73F3A4`, branco neutro `#FAFAFA`. Sem misturar com outras direções.
- **Typography**: Montserrat Alternates (display) + Inter (body) + JetBrains Mono (mono / status).
- **Motion**: GSAP timeline para hero (revelação de linhas via clip), ScrollTrigger para reveals abaixo da fold, animações dos counters do console, accordion CSS-driven.
- **Performance**:
  - Hero canvas desativa em touch devices, respeita `prefers-reduced-motion`, pausa quando fora do viewport ou aba escondida, particle count escalado por área.
  - Fontes preloaded (apenas as críticas above-the-fold).
  - GSAP via CDN com `defer`.
  - SVGs lazy-loaded.

## SEO / Open Graph

Meta tags completas em `<head>` do `Landing Page.html`:
- `og:image` aponta para `assets/og-image.svg` (1200×630).
- ⚠️ **Pré-launch**: gerar versão `.png` da OG image (Twitter/X não renderiza SVG bem). Exportar via Figma / browser-screenshot do SVG.
- Schema.org JSON-LD com `Organization` + `SoftwareApplication`.

## Placeholders pendentes (TEAM)

Itens marcados no código que precisam de input real antes do launch:

1. **Trust Bar** (`.trust-stats` no HTML) — `300+`, `2.4M`, `90min`, `99,98%`. Substituir pelos números reais da operação.
2. **Testimonials** (`.testimonial` cards) — 3 quotes placeholder. Substituir por depoimentos reais com nome, role, número de lojas e métrica concreta.
3. **Avatars** — geradas via CSS (iniciais). Substituir por fotos reais quando disponíveis (troca `.t-avatar` div por `<img>`).
4. **Footer Legal** — links `Termos`, `Privacidade`, `LGPD` apontam para `#`. Adicionar URLs reais.
5. **CNPJ** — base do footer diz "CNPJ disponível sob solicitação". Substituir pelo CNPJ real.
6. **OG image PNG** — gerar `assets/og-image.png` a partir do SVG e atualizar meta tags.
7. **Pricing tiers** — atualmente 4 tiers. Audit recomendou avaliar se 3 + custom seria melhor (decisão de business).

## Browser support

Modernos (Chrome / Edge / Safari / Firefox últimas 2 versões). Não testado em IE11.

## Licença

Proprietário. © 2026 Distinct Services.
