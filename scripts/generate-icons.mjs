import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../public/icons')

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#1D9E75"/>
  <rect x="140" y="130" width="232" height="286" rx="24" fill="#ffffff"/>
  <rect x="176" y="96" width="160" height="52" rx="16" fill="#ffffff"/>
  <path d="M176 268 l56 56 104-104" stroke="#1D9E75" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

fs.mkdirSync(outDir, { recursive: true })

const svgBuffer = Buffer.from(iconSvg)

for (const size of [192, 512]) {
  await sharp(svgBuffer).resize(size, size).png().toFile(path.join(outDir, `icon-${size}x${size}.png`))
  console.log(`Created icon-${size}x${size}.png`)
}

// Maskable icon: 80% safe zone
await sharp(svgBuffer)
  .resize(410, 410)
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: '#1D9E75' })
  .png()
  .toFile(path.join(outDir, 'maskable-icon-512x512.png'))
console.log('Created maskable-icon-512x512.png')
