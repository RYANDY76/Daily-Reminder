import { test, expect, type Page } from '@playwright/test'

async function enterApp(page: Page) {
  await page.goto('/')
  await page.locator('button:has-text("Lanjut Tanpa Akun")').click()
  await page.waitForTimeout(2000)
  const skipBtn = page.locator('button:has-text("Lewati")')
  if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await skipBtn.click()
    await page.waitForTimeout(500)
  }
}

test.describe('Feature Navigation E2E', () => {
  test('Navigate to Pomodoro via bottom nav', async ({ page }) => {
    await enterApp(page)
    await page.locator('button[aria-label="Pomodoro"]').click()
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/pomodoro')
  })

  test('Navigate to Habits via bottom nav', async ({ page }) => {
    await enterApp(page)
    await page.locator('button[aria-label="Kebiasaan"]').click()
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/habits')
  })

  test('Navigate to Goals via bottom nav More menu', async ({ page }) => {
    await enterApp(page)
    await page.locator('button[aria-label="Lainnya"]').click()
    await page.waitForTimeout(500)
    await page.locator('[role="dialog"] button:has-text("Target")').click()
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/goals')
  })

  test('Navigate to Calendar via bottom nav', async ({ page }) => {
    await enterApp(page)
    await page.locator('button[aria-label="Kalender"]').click()
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/calendar')
  })

  test('Navigate to Stats via bottom nav More menu', async ({ page }) => {
    await enterApp(page)
    await page.locator('button[aria-label="Lainnya"]').click()
    await page.waitForTimeout(500)
    await page.locator('[role="dialog"] button:has-text("Statistik")').click()
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/stats')
  })
})
