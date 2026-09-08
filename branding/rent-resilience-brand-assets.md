# Rent Resilience brand assets

Derived from the kylebrodeur brand system (warm charcoal `#1a1510`, gold `#c98d1a`, teal
`#5a9e80`, cream `#e8dfd0`, Bricolage Grotesque). The mark is a teal sprout sheltered
under a gold roof chevron: reliability compounding under housing. SVG sources sit beside
each PNG; regenerate with `rsvg-convert`.

| Placement | Asset | Source size | Constraint |
|---|---|---:|---|
| Base Dashboard app icon | `rent-resilience-app-icon.png` | 1024 x 1024 | square |
| Base Dashboard app thumbnail | `rent-resilience-thumbnail.png` | 1200 x 628 | 1.91:1, max 1 MB |

App screenshots (1284 x 2778, up to 3) are deliberately absent: no fabricated product UI.
Capture real screenshots once the sandbox ships.

```bash
rsvg-convert -w 1024 -h 1024 rent-resilience-app-icon.svg -o rent-resilience-app-icon.png
rsvg-convert -w 1200 -h 628 rent-resilience-thumbnail.svg -o rent-resilience-thumbnail.png
```
