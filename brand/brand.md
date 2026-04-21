# claude-bridge — Brand guidelines

Minimal, dev-first visual identity. Philosophy: **shadcn-style neutral base + one accent color for the "connection".**

---

## 1. Logo

Three variants, all in `brand/`:

| File | Use |
|---|---|
| `logo-symbol.svg` | Favicon, app icon, social avatar, tiny sizes |
| `logo-wordmark.svg` | Text-heavy contexts, README headers, footers |
| `logo-lockup.svg` | Primary lockup (symbol + wordmark) — hero, LP, social preview |
| `favicon.svg` | 32×32 rounded favicon variant |
| `social-preview.svg` | 1280×640 GitHub / Twitter / HN social card |

**The symbol:** two filled circles connected by a green horizontal line. The circles are the "endpoints" (your Mac and your phone). The green line is the bridge. Single mental model, scales from 16px favicon to 1280×640 social card.

**Spacing:** leave at least half the symbol's width as clear space on every side.

**Don't:**
- Rotate the symbol
- Change the line color to anything but `--accent`
- Fill the circles with color (they stay neutral)
- Add shadow, gradient, bevel

---

## 2. Color tokens

Dark-first. All tokens in HSL so they map cleanly to Tailwind/shadcn themes.

| Token | HSL | HEX | Use |
|---|---|---|---|
| `--background` | `0 0% 4%` | `#0a0a0a` | primary background, dark canvas |
| `--foreground` | `0 0% 98%` | `#fafafa` | primary text, logo dots |
| `--muted` | `240 4% 13%` | `#1f2023` | secondary surfaces (cards, code blocks) |
| `--muted-foreground` | `240 5% 64%` | `#97979f` | secondary text, captions |
| `--border` | `240 4% 16%` | `#262629` | dividers, subtle borders |
| `--primary` | `0 0% 98%` | `#fafafa` | primary CTA (white button on dark bg) |
| `--primary-foreground` | `0 0% 4%` | `#0a0a0a` | text on primary CTA |
| `--accent` | `165 100% 50%` | `#00ffa9` | **the bridge color** — sparingly |

**Accent rules:**
- Only in: the bridge line (logo), syntax highlighting hints, 1 CTA per view, the `-` in `claude-bridge` wordmark
- **Never** as a large area background (it vibrates on black)
- **Never** paired with red/orange (clashes)

### Light mode (optional, for LP)

| Token | HSL | HEX |
|---|---|---|
| `--background` | `0 0% 100%` | `#ffffff` |
| `--foreground` | `240 10% 4%` | `#0a0a0a` |
| `--muted` | `240 5% 96%` | `#f4f4f5` |
| `--muted-foreground` | `240 4% 46%` | `#71717a` |
| `--border` | `240 6% 90%` | `#e4e4e7` |
| `--accent` | `165 100% 38%` | `#00c285` *(slightly darker for WCAG contrast on white)* |

---

## 3. Typography

Both free, self-hosted via `next/font/google` (Vercel) or Google Fonts CDN.

| Role | Font | Weights | Fallback |
|---|---|---|---|
| **Sans (body, UI, headlines)** | [Geist](https://vercel.com/font) | 400, 500, 600, 700 | Inter, system-ui |
| **Mono (code, CLI output, numbers)** | [Geist Mono](https://vercel.com/font) | 400, 500, 600 | JetBrains Mono, ui-monospace |

### Scale (using shadcn defaults)

```css
--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
--text-5xl:  3rem;      /* 48px */
--text-6xl:  3.75rem;   /* 60px */
```

### Letter-spacing

- Display/headings: `-0.02em` (tracked slightly tight, per Geist's design)
- Body: `-0.01em` or default
- All-caps labels: `0.08em` (opened up)

---

## 4. Voice

- **Honest, technical, minimal** — no marketing fluff
- Second person casual ("you"), like a dev writing to a dev
- Code, not claims — show `claude --print`, not "blazing fast AI"
- Emoji sparingly, only where they add meaning (✅ ❌ 🛑 — not 🚀🔥)
- Write in English for the project, Portuguese for internal docs

Reference: the current [README.md](../README.md) and [docs/why-persistence.md](../docs/why-persistence.md) are on-tone.

---

## 5. How to export PNGs (for GitHub social preview, etc.)

```bash
# Install once
brew install librsvg

# Export social preview as PNG
rsvg-convert -w 1280 -h 640 brand/social-preview.svg -o brand/social-preview.png

# Export favicon variants
rsvg-convert -w 32 -h 32 brand/favicon.svg -o brand/favicon-32.png
rsvg-convert -w 180 -h 180 brand/favicon.svg -o brand/apple-touch-icon.png
```

Upload `social-preview.png` to: GitHub repo → Settings → Social preview → Upload an image.

---

## 6. Inspiration

- [shadcn/ui](https://ui.shadcn.com) — the gold standard for this style
- [zed.dev](https://zed.dev) — typography, density
- [resend.com](https://resend.com) — accent color usage (blue)
- [linear.app](https://linear.app) — minimalism done right
