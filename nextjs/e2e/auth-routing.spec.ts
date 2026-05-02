import { test, expect } from '@playwright/test'

/**
 * Sayfa render testleri. Backend'siz sınanır.
 * Middleware/redirect davranışı vitest middleware.test.ts'de unit olarak sınanıyor;
 * gerçek redirect e2e'de NextAuth session validation gerekiyor (entegrasyon ortamı).
 */

test.describe('Public sayfa render', () => {
  test('/giris SaaS login formu', async ({ page }) => {
    await page.goto('/giris')
    await expect(page.getByRole('heading', { name: /giriş yap/i })).toBeVisible()
    await expect(page.getByLabel('E-posta')).toBeVisible()
    await expect(page.getByLabel('Şifre')).toBeVisible()
    await expect(page.getByRole('link', { name: /ücretsiz başla/i })).toBeVisible()
  })

  test('/kayit company register formu', async ({ page }) => {
    await page.goto('/kayit')
    await expect(page.getByRole('heading', { name: /pettoptan/i })).toBeVisible()
    await expect(page.getByLabel('İşletme Adı')).toBeVisible()
    await expect(page.getByLabel('E-posta')).toBeVisible()
    await expect(page.getByLabel('Şifre')).toBeVisible()
    await expect(page.getByRole('button', { name: /ücretsiz hesap/i })).toBeVisible()
  })

  test('/giris hatalı şifre toast veya alert gösterir', async ({ page }) => {
    await page.goto('/giris')
    await page.getByLabel('E-posta').fill('test@example.com')
    await page.getByLabel('Şifre').fill('wrong-password-x')
    await page.getByRole('button', { name: /giriş yap/i }).click()
    // Backend yoksa NextAuth credentials authorize null döner → form alert mesajı
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 })
  })
})
