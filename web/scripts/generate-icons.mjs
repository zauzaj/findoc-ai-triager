/**
 * Generates PWA icon PNGs from the SVG source.
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const iconsDir = path.join(__dirname, '../public/icons')
mkdirSync(iconsDir, { recursive: true })

// Inline SVG at full quality — no external files needed
function makeSvg(size) {
  const radius = Math.round(size * 0.167)
  const fontSize = Math.round(size * 0.417)
  const textY = Math.round(size * 0.604)
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#00a9b7"/>
  <text x="${size / 2}" y="${textY}" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle">F</text>
</svg>`)
}

const sizes = [
  { name: 'icon-192.png',        size: 192 },
  { name: 'icon-512.png',        size: 512 },
  { name: 'icon-maskable-192.png', size: 192, padded: true },
  { name: 'icon-maskable-512.png', size: 512, padded: true },
  { name: 'apple-touch-icon.png',  size: 180 },
  { name: 'favicon-32.png',        size: 32  },
]

for (const { name, size, padded } of sizes) {
  let svg

  if (padded) {
    // Maskable icons need safe-zone padding (~10% each side)
    const inner = Math.round(size * 0.8)
    const offset = Math.round(size * 0.1)
    const innerRadius = Math.round(inner * 0.167)
    const fontSize = Math.round(inner * 0.417)
    const textY = Math.round(inner * 0.604)
    svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#00a9b7"/>
  <rect x="${offset}" y="${offset}" width="${inner}" height="${inner}" rx="${innerRadius}" fill="#008fa5"/>
  <text x="${size / 2}" y="${offset + textY}" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle">F</text>
</svg>`)
  } else {
    svg = makeSvg(size)
  }

  await sharp(svg).png().toFile(path.join(iconsDir, name))
  console.log(`✓ ${name}`)
}

console.log('All icons generated.')
