/**
 * PWA Screenshot Generator
 * Run: node scripts/generate-screenshots.mjs
 * Requires: dev server running on http://localhost:5173
 */
import { chromium } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = resolve(__dirname, '../public/screenshots')

mkdirSync(OUTPUT_DIR, { recursive: true })

async function wait(time) {
  return new Promise(r => setTimeout(r, time))
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  
  try {
    // --- NARROW (mobile 375x812) ---
    const mobileCtx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      locale: 'id-ID'
    })
    const mobile = await mobileCtx.newPage()
    await mobile.goto('http://localhost:5173', { waitUntil: 'networkidle' })
    await wait(2000)
    await mobile.screenshot({ path: resolve(OUTPUT_DIR, 'narrow.png'), fullPage: false })
    console.log('✓ narrow.png generated (375x812)')
    await mobileCtx.close()

    // --- WIDE (desktop 1280x800) ---
    const desktopCtx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
      locale: 'id-ID'
    })
    const desktop = await desktopCtx.newPage()
    await desktop.goto('http://localhost:5173', { waitUntil: 'networkidle' })
    await wait(2000)
    await desktop.screenshot({ path: resolve(OUTPUT_DIR, 'wide.png'), fullPage: false })
    console.log('✓ wide.png generated (1280x800)')
    await desktopCtx.close()

    console.log('\n✅ All screenshots generated successfully!')
  } catch (err) {
    console.error('❌ Screenshot generation failed:', err.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

main()
