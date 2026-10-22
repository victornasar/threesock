# threesock brand assets

The name is always lowercase: **threesock**.

| File | Use |
|------|-----|
| `threesock-lockup.svg` / `-white.svg` | Primary logo: README header, website, docs |
| `threesock-wordmark.svg` / `-white.svg` | Name only, where the icon already appears nearby |
| `threesock-icon.svg` / `-white.svg` | Icon only: app icons, small placements |
| `favicon.svg` | Browser tab icon; switches to white in dark mode |
| `favicon.ico`, `favicon-16/32/48.png` | Favicon fallbacks for older browsers |
| `apple-touch-icon.png` | iOS home-screen icon (180 px) |
| `icon-192.png`, `icon-512.png` | Web app manifest icons |
| `github-avatar.png` | GitHub organization and social profile avatar |
| `social-preview.png` | GitHub repository social preview and Open Graph image (1280 x 640) |

## Rules

- Black on light backgrounds, white on dark. No other colors, gradients, shadows or effects.
- Don't stretch, rotate, recolor or rebuild the logo, and don't set the name in another font.
- Keep clear space around the logo of at least the height of the "t".
- Use the icon alone below about 100 px wide; use the lockup above that.

## Typography

- Headlines: Mona Sans (bold, slightly condensed width)
- Body: Switzer
- Code and terminal: Commit Mono

## README header (switches with GitHub light/dark mode)

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/brand/threesock-lockup-white.svg">
  <img alt="threesock" src="assets/brand/threesock-lockup.svg" width="320">
</picture>
```

## Website `<head>`

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:image" content="/social-preview.png">
```
