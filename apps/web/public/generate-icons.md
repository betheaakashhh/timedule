# Icon Generation

The PWA requires icon-192.png and icon-512.png.

## Quick generation (Node.js)
Run this once after setup to generate simple placeholder icons:

```bash
npm install -g sharp-cli
# Or use any image editing tool to create:
# - icon-192.png: 192x192px, purple (#7F77DD) background with white timer icon
# - icon-512.png: 512x512px, same design
```

## Using the SVG template
The icon design uses the TimeFlow logo: purple rounded square (#7F77DD) with a white clock/timer icon.

You can convert the SVG below to PNG at 192px and 512px using:
- Figma (paste SVG, export as PNG)
- Inkscape: `inkscape icon.svg --export-png=icon-192.png -w 192 -h 192`
- ImageMagick: `convert -background '#7F77DD' -size 192x192 icon.svg icon-192.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="120" fill="#7F77DD"/>
  <circle cx="256" cy="256" r="140" fill="none" stroke="white" stroke-width="24"/>
  <line x1="256" y1="256" x2="256" y2="150" stroke="white" stroke-width="24" stroke-linecap="round"/>
  <line x1="256" y1="256" x2="320" y2="290" stroke="white" stroke-width="20" stroke-linecap="round"/>
  <circle cx="256" cy="256" r="12" fill="white"/>
</svg>
```

## For development
Place any 192×192 and 512×512 PNG files at:
- /public/icon-192.png
- /public/icon-512.png
