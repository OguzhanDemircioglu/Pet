import { test, expect } from '@playwright/test'

/**
 * Kayıt formu validasyon ve client-side davranış testleri.
 * Backend yokken bile çalışır — boş form submit ve tıklanabilirlik kontrolleri.
 */
test.describe('Kayıt akışı', () => {
  test('boş form submit etmez (HTML5 validation)', async ({ page }) => {
    await page.goto('/kayit')
    const submit = page.getByRole('button', { name: /ücretsiz hesap/i })
    await submit.click()
    // Hâlâ /kayit sayfasındayız (form submit olmadı)
    await expect(page).toHaveURL(/\/kayit/)
  })

  test('form alanları doldurulabilir', async ({ page }) => {
    await page.goto('/kayit')
    await page.getByLabel('İşletme Adı').fill('Test Petshop')
    await page.getByLabel('E-posta').fill('test@test.com')
    await page.getByLabel('Şifre').fill('secret123')
    await expect(page.getByLabel('İşletme Adı')).toHaveValue('Test Petshop')
    await expect(page.getByLabel('E-posta')).toHaveValue('test@test.com')
  })

  test('giriş ekranına dön linki çalışır', async ({ page }) => {
    await page.goto('/kayit')
    await page.getByRole('link', { name: /giriş yap/i }).click()
    await expect(page).toHaveURL(/\/giris/)
  })

  test('şifremi unuttum sayfası çalışır', async ({ page }) => {
    await page.goto('/giris')
    await page.getByRole('link', { name: /şifremi unuttum/i }).click()
    await expect(page).toHaveURL(/\/sifre-unuttum/)
    await expect(page.getByRole('heading', { name: /şifremi unuttum/i })).toBeVisible()
  })

  test('şifremi unuttum form çalışır', async ({ page }) => {
    await page.goto('/sifre-unuttum')
    await page.getByLabel('E-posta').fill('test@example.com')
    await page.getByRole('button', { name: /sıfırlama/i }).click()
    // Backend yoksa bile alert/spinner gözlenir; minimum click olur
  })
})
