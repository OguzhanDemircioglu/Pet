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

  test('/giris login formu render', async ({ page }) => {
    await page.goto('/giris')
    await expect(page.getByRole('heading', { name: /tekrar hoş geldiniz/i })).toBeVisible()
    const loginForm = page.getByRole('form', { name: /giriş formu/i })
    await expect(loginForm.getByLabel('E-posta')).toBeVisible()
    await expect(loginForm.getByLabel('Şifre', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: /şifremi unuttum/i })).toBeVisible()
  })

  test('/kayit company register formu render', async ({ page }) => {
    await page.goto('/kayit')
    await expect(page.getByRole('heading', { name: /ücretsiz kayıt ol/i })).toBeVisible()
    const regForm = page.getByRole('form', { name: /kayıt formu/i })
    await expect(regForm.getByLabel('İşletme Adı')).toBeVisible()
    await expect(regForm.getByLabel('E-posta')).toBeVisible()
    await expect(regForm.getByLabel('Şifre', { exact: true })).toBeVisible()
    await expect(regForm.getByRole('button', { name: /üye ol/i })).toBeVisible()
  })

  test('giriş hatalı şifre alert mesajı gösterir', async ({ page }) => {
    await page.goto('/giris')
    const loginForm = page.getByRole('form', { name: /giriş formu/i })
    await loginForm.getByLabel('E-posta').fill('test@example.com')
    await loginForm.getByLabel('Şifre', { exact: true }).fill('wrong-password-x')
    await loginForm.getByRole('button', { name: /giriş yap/i }).click()
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 })
  })
})
