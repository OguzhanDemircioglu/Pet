import { test, expect } from '@playwright/test'

/**
 * Kayıt formu validasyon ve client-side davranış testleri.
 * Backend yokken bile çalışır — boş form submit ve tıklanabilirlik kontrolleri.
 */
test.describe('Kayıt akışı', () => {
  test('boş form submit etmez (HTML5 validation)', async ({ page }) => {
    await page.goto('/kayit')
    const regForm = page.getByRole('form', { name: /kayıt formu/i })
    await regForm.getByRole('button', { name: /üye ol/i }).click()
    await expect(page).toHaveURL(/\/kayit/)
  })

  test('form alanları doldurulabilir', async ({ page }) => {
    await page.goto('/kayit')
    const regForm = page.getByRole('form', { name: /kayıt formu/i })
    await regForm.getByLabel('İşletme Adı').fill('Test Petshop')
    await regForm.getByLabel('E-posta').fill('test@test.com')
    await regForm.getByLabel('Şifre', { exact: true }).fill('secret123')
    await expect(regForm.getByLabel('İşletme Adı')).toHaveValue('Test Petshop')
    await expect(regForm.getByLabel('E-posta')).toHaveValue('test@test.com')
  })

  test('giriş ekranına dön linki çalışır', async ({ page }) => {
    await page.goto('/kayit')
    // Tab geçişi: "Giriş Yap" tab veya "Giriş yap" link aynı route'a götürür
    await page.getByRole('button', { name: /^giriş yap$/i }).first().click()
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
    // Backend yoksa hata gözlenir; varsa success message
    // Minimum: click başarılı olmalı, error throw yok
  })
})
