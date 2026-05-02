import { test, expect } from '@playwright/test'

test.describe('Auth-only routing (backend gerektirmez)', () => {
  test('anasayfa auth\'suz → /giris', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/giris(\?|$)/)
  })

  test('/dashboard auth\'suz → /giris (callbackUrl ile)', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/giris\?.*callbackUrl=.*dashboard/)
  })

  test('/urunler auth\'suz → /giris', async ({ page }) => {
    await page.goto('/urunler')
    await expect(page).toHaveURL(/\/giris/)
  })

  test('/satislar auth\'suz → /giris', async ({ page }) => {
    await page.goto('/satislar')
    await expect(page).toHaveURL(/\/giris/)
  })

  test('/kullanicilar auth\'suz → /giris', async ({ page }) => {
    await page.goto('/kullanicilar')
    await expect(page).toHaveURL(/\/giris/)
  })

  test('/giris SaaS login formu render', async ({ page }) => {
    await page.goto('/giris')
    await expect(page.getByRole('heading', { name: /giriş yap/i })).toBeVisible()
    await expect(page.getByLabel('E-posta')).toBeVisible()
    await expect(page.getByLabel('Şifre')).toBeVisible()
    await expect(page.getByRole('link', { name: /ücretsiz başla/i })).toBeVisible()
  })

  test('/kayit company register formu render', async ({ page }) => {
    await page.goto('/kayit')
    await expect(page.getByRole('heading', { name: /pettoptan/i })).toBeVisible()
    await expect(page.getByLabel('İşletme Adı')).toBeVisible()
    await expect(page.getByLabel('E-posta')).toBeVisible()
    await expect(page.getByLabel('Şifre')).toBeVisible()
    await expect(page.getByRole('button', { name: /ücretsiz hesap/i })).toBeVisible()
  })

  test('giriş hatalı şifre alert mesajı gösterir', async ({ page }) => {
    await page.goto('/giris')
    await page.getByLabel('E-posta').fill('test@example.com')
    await page.getByLabel('Şifre').fill('wrong-password-x')
    await page.getByRole('button', { name: /giriş yap/i }).click()
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 })
  })
})
