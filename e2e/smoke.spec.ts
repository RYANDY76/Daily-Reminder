import { test, expect } from '@playwright/test'

test.describe('Daily Reminder E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Landing page loads and shows app name', async ({ page }) => {
    await expect(page.locator('text=Daily Reminder')).toBeVisible()
  })

  test('Guest mode allows entering the app', async ({ page }) => {
    // Click "Lanjut sebagai Tamu" (guest mode button)
    const guestBtn = page.locator('button:has-text("Tamu")')
    await expect(guestBtn).toBeVisible()
    await guestBtn.click()

    // Should navigate to Welcome page or directly to Dashboard
    await page.waitForTimeout(2000)

    // Check we're in the app — look for the Add Task button or heading
    const heading = page.locator('h2:has-text("Ringkasan")')
    await expect(heading).toBeVisible({ timeout: 10000 })
  })

  test('Create a task via the FAB button', async ({ page }) => {
    // Enter guest mode first
    await page.locator('button:has-text("Tamu")').click()
    await page.waitForTimeout(2000)

    // Fill profile name in Welcome screen if shown
    const nameInput = page.locator('input[placeholder*="Nama"]')
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User')
      await page.locator('button:has-text("Mulai")').click()
      await page.waitForTimeout(2000)
    }

    // Click the + (FAB) button
    const fab = page.locator('button[aria-label*="Tambah"]').or(page.locator('button:has-text("+")'))
    await expect(fab).toBeVisible({ timeout: 5000 })
    await fab.click()

    // Fill task form
    const taskInput = page.locator('input[placeholder*="tugas"]')
    await expect(taskInput).toBeVisible({ timeout: 5000 })
    await taskInput.fill('E2E Test Task')

    // Submit
    await page.locator('button:has-text("Simpan")').click()
    await page.waitForTimeout(1000)

    // Verify task appears
    await expect(page.locator('text=E2E Test Task')).toBeVisible({ timeout: 5000 })
  })

  test('Toggle dark mode', async ({ page }) => {
    await page.locator('button:has-text("Tamu")').click()
    await page.waitForTimeout(2000)

    // Navigate to settings via URL
    // First check if we're on dashboard
    await page.waitForURL('**/*')
    
    // Find and click dark mode toggle (in header or settings)
    // The dark mode toggle has aria-label that changes based on state
    const darkToggle = page.locator('[aria-label*="Gelap"],[aria-label*="Terang"]')
    if (await darkToggle.isVisible()) {
      await darkToggle.click()
      // Check that dark class was added to html
      const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
      expect(hasDark).toBeTruthy()
    }
  })
})
