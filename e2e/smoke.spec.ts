import { test, expect, type Page } from '@playwright/test'

async function dismissOnboarding(page: Page) {
  await page.evaluate(() => localStorage.setItem('daily_reminder_onboarding_done', 'true'))
  const dialog = page.getByRole('dialog')
  if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
    await dialog.getByRole('button', { name: /Lewati|Skip/i }).first().click()
  }
}

test.describe('Daily Reminder smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('e2e-reset-done')) return
      sessionStorage.setItem('e2e-reset-done', '1')
      localStorage.clear()
      indexedDB.deleteDatabase('DailyReminderDB')
      indexedDB.deleteDatabase('DailyReminderNotifications')
    })
  })

  test('welcome screen shows app name', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Daily Reminder/i }).first()).toBeVisible()
  })

  test('create local profile and reach dashboard', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Buat Akun Baru|Create New Account/i }).click()
    await page.getByPlaceholder(/Nama|Name/i).fill('E2E User')
    await page.getByRole('button', { name: /Halo, E2E|Hello, E2E/i }).click()

    await dismissOnboarding(page)
    await expect(page.getByText('E2E User').first()).toBeVisible({ timeout: 10_000 })
  })

  test('landing page loads', async ({ page }) => {
    await page.goto('/#/about')
    await expect(page.getByRole('heading', { name: /Daily Reminder/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Buka Aplikasi|Open App|Mulai Sekarang|Get Started/i }).first()).toBeVisible()
  })

  test('navigate to settings', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Buat Akun Baru|Create New Account/i }).click()
    await page.getByPlaceholder(/Nama|Name/i).fill('Settings User')
    await page.getByRole('button', { name: /Halo, Settings|Hello, Settings/i }).click()

    await dismissOnboarding(page)
    await page.getByRole('button', { name: /^Pengaturan$|^Settings$/i }).click()
    await expect(page.getByRole('heading', { name: /^Pengaturan$|^Settings$/i })).toBeVisible()
  })
})
