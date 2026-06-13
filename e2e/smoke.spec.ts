import { test, expect, type Page } from '@playwright/test'

test.use({ viewport: { width: 375, height: 812 } })

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

test.describe('Avora E2E', () => {
  test('Landing page loads and shows app name', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Avora')).toBeVisible()
  })

  test('Guest mode enters the app', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("Lanjut Tanpa Akun")').click()
    await page.waitForTimeout(2000)

    const skipBtn = page.locator('button:has-text("Lewati")')
    if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(500)
    }

    await expect(page.getByRole('button', { name: 'Tambah Tugas' }).last()).toBeVisible({ timeout: 10000 })
  })

  test('Create a task via the FAB button', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("Lanjut Tanpa Akun")').click()
    await page.waitForTimeout(2000)

    const skipBtn = page.locator('button:has-text("Lewati")')
    if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(500)
    }

    await page.getByRole('button', { name: 'Tambah Tugas' }).last().click()
    await page.waitForTimeout(2000)

    const taskInput = page.locator('#task-title')
    await expect(taskInput).toBeVisible({ timeout: 10000 })
    await taskInput.fill('E2E Test Task')
    await page.locator('.modal-content button:has-text("Tambah Tugas")').click()
    await page.waitForTimeout(2000)

    await expect(page.locator('text=E2E Test Task')).toBeVisible({ timeout: 10000 })
  })

  test('Toggle dark mode', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("Lanjut Tanpa Akun")').click()
    await page.waitForTimeout(2000)

    const skipBtn = page.locator('button:has-text("Lewati")')
    if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(500)
    }

    await page.locator('[aria-label="Mode Gelap"]').last().click()
    await page.waitForTimeout(500)

    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBeTruthy()
  })

  test('Navigate to Settings via bottom nav More menu', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("Lanjut Tanpa Akun")').click()
    await page.waitForTimeout(2000)

    const skipBtn = page.locator('button:has-text("Lewati")')
    if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(500)
    }

    await page.locator('button[aria-label="Lainnya"]').click()
    await page.waitForTimeout(500)
    await page.locator('[role="dialog"] button:has-text("Pengaturan")').click()
    await page.waitForTimeout(2000)

    expect(page.url()).toContain('/settings')
  })

  test('Navigate to Couple page via bottom nav More menu', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("Lanjut Tanpa Akun")').click()
    await page.waitForTimeout(2000)

    const skipBtn = page.locator('button:has-text("Lewati")')
    if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(500)
    }

    await page.locator('button[aria-label="Lainnya"]').click()
    await page.waitForTimeout(500)
    await page.locator('[role="dialog"] button:has-text("Pasangan")').click()
    await page.waitForTimeout(2000)

    expect(page.url()).toContain('/couple')
  })

  test('Export modal opens from Settings page', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("Lanjut Tanpa Akun")').click()
    await page.waitForTimeout(2000)

    const skipBtn = page.locator('button:has-text("Lewati")')
    if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(500)
    }

    await page.locator('button[aria-label="Lainnya"]').click()
    await page.waitForTimeout(500)
    await page.locator('[role="dialog"] button:has-text("Pengaturan")').click()
    await page.waitForTimeout(2000)

    await page.locator('button:has-text("Ekspor Jadwal")').click()
    await page.waitForTimeout(1000)

    await expect(page.locator('text=Ekspor Data')).toBeVisible({ timeout: 5000 })
  })

  test('Couple page shows connect dialog', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("Lanjut Tanpa Akun")').click()
    await page.waitForTimeout(2000)

    const skipBtn = page.locator('button:has-text("Lewati")')
    if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(500)
    }

    await page.locator('button[aria-label="Lainnya"]').click()
    await page.waitForTimeout(500)
    await page.locator('[role="dialog"] button:has-text("Pasangan")').click()
    await page.waitForTimeout(2000)

    await expect(page.locator('button:has-text("Mulai")')).toBeVisible({ timeout: 5000 })
    await page.locator('button:has-text("Mulai")').click()
    await page.waitForTimeout(1000)

    await expect(page.locator('.fixed.z-50 h2:has-text("Hubungkan dengan Pasangan")')).toBeVisible({ timeout: 5000 })
  })
})
