package com.petshop.notification.service;

import com.petshop.notification.constant.EmailMessages;
import com.petshop.siteadmin.api.SiteSettingsFacade;
import com.petshop.siteadmin.api.SiteSettingsView;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private final RestTemplate restTemplate = new RestTemplate();
    private final SiteSettingsFacade siteSettings;

    @Value("${app.brevo-api-key:}")
    private String brevoApiKey;

    @Value("${app.mail-from:info@petshop.com.tr}")
    private String fromEmail;

    private String appName()      { return siteSettings.getAppName(); }
    private String appNamePart1() { return nz(siteSettings.getSettings().brandPart1()); }
    private String appNamePart2() { return nz(siteSettings.getSettings().brandPart2()); }
    private String appDomain()    { return siteSettings.getAppDomain(); }
    private String appYear()      { return nz(siteSettings.getSettings().appYear()); }

    private static String nz(String v) { return v == null ? "" : v; }

    public void sendHtml(String to, String subject, String html) throws Exception {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            throw new IllegalStateException("BREVO_API_KEY tanımlı değil");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);

        Map<String, Object> body = Map.of(
                "sender",      Map.of("name", appName(), "email", fromEmail),
                "to",          List.of(Map.of("email", to)),
                "subject",     subject,
                "htmlContent", html
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(BREVO_API_URL, request, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Brevo API hatası: " + response.getStatusCode() + " — " + response.getBody());
        }

        log.info(EmailMessages.SENT.get(), to);
    }

    public String buildOrderConfirmationEmail(String firstName, Long orderId,
                                               String itemsHtml, String deliveryAddress, String totalAmount) {
        return """
            <!DOCTYPE html>
            <html lang="tr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:40px 0">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)">

                    <!-- Header -->
                    <tr>
                      <td style="background:#1e3a5f;padding:28px 40px;text-align:center">
                        <span style="font-size:22px;font-weight:700;color:#ffffff">
                          <span style="color:#dc2626">%s</span><span style="color:#38bdf8">%s</span>
                        </span>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:40px">
                        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1e3a5f">Siparişiniz Alındı!</p>
                        <p style="margin:0 0 24px;font-size:15px;color:#64748b">Merhaba <strong>%s</strong>, siparişinizi aldık. En kısa sürede sizinle iletişime geçeceğiz.</p>

                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
                          <tr>
                            <td style="background:#f1f5f9;padding:12px 16px;border-radius:8px">
                              <span style="font-size:13px;color:#64748b">Sipariş No:</span>
                              <span style="font-size:15px;font-weight:700;color:#1e3a5f;margin-left:8px">#%d</span>
                            </td>
                          </tr>
                        </table>

                        <!-- Ürünler -->
                        <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:.5px">Sipariş Detayı</p>
                        <table width="100%%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px">
                          <tr style="background:#f8f9fa">
                            <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase">Ürün</td>
                            <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:center">Adet</td>
                            <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:right">Tutar</td>
                          </tr>
                          %s
                          <tr style="border-top:2px solid #e2e8f0;background:#f8f9fa">
                            <td colspan="2" style="padding:12px 16px;font-size:14px;font-weight:700;color:#1a1a1a">Toplam</td>
                            <td style="padding:12px 16px;font-size:16px;font-weight:700;color:#dc2626;text-align:right">₺%s</td>
                          </tr>
                        </table>

                        <!-- Teslimat -->
                        <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:.5px">Teslimat Adresi</p>
                        <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:28px">
                          <p style="margin:0;font-size:14px;color:#475569;line-height:1.7">%s</p>
                        </div>

                        <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6">
                          Sipariş durumunuzu hesabınızdan takip edebilirsiniz. Herhangi bir sorun için bizimle iletişime geçin.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
                        <p style="margin:0;font-size:12px;color:#94a3b8">© %s %s%s · %s</p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(appNamePart1(), appNamePart2(), firstName, orderId, itemsHtml, totalAmount, deliveryAddress, appYear(), appNamePart1(), appNamePart2(), appDomain());
    }

    public String buildVerificationEmail(String firstName, String code) {
        return """
            <!DOCTYPE html>
            <html lang="tr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:40px 0">
                <tr><td align="center">
                  <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)">

                    <!-- Header -->
                    <tr>
                      <td style="background:#1e3a5f;padding:28px 40px;text-align:center">
                        <span style="font-size:22px;font-weight:700;color:#ffffff">
                          <span style="color:#dc2626">%s</span><span style="color:#38bdf8">%s</span>
                        </span>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:40px">
                        <p style="margin:0 0 16px;font-size:16px;color:#1a1a1a">Merhaba <strong>%s</strong>,</p>
                        <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6">
                          %s hesabınızı doğrulamak için aşağıdaki 6 haneli kodu kullanın.
                          Bu kod <strong>24 saat</strong> geçerlidir.
                        </p>

                        <!-- Code box -->
                        <div style="background:#f1f5f9;border:2px dashed #dc2626;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px">
                          <span style="font-size:38px;font-weight:800;letter-spacing:10px;color:#1e3a5f">%s</span>
                        </div>

                        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8">
                          Bu kodu kimseyle paylaşmayın. Eğer hesap açmadıysanız bu emaili görmezden gelin.
                        </p>
                        <p style="margin:0;font-size:13px;color:#94a3b8">
                          Doğrulama yapılmayan hesaplar <strong>1 hafta</strong> içinde otomatik silinir.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
                        <p style="margin:0;font-size:12px;color:#94a3b8">© %s %s · %s</p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(appNamePart1(), appNamePart2(), firstName, appName(), code, appYear(), appName(), appDomain());
    }

    public String buildStockNotificationEmail(String productName, String variantLabel, String productUrl) {
        String variantLine = variantLabel == null || variantLabel.isBlank()
                ? ""
                : "<p style=\"margin:0 0 12px;font-size:14px;color:#64748b\">Seçim: <strong>" + variantLabel + "</strong></p>";
        return """
            <!DOCTYPE html>
            <html lang="tr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:40px 0">
                <tr><td align="center">
                  <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)">

                    <tr>
                      <td style="background:#1e3a5f;padding:28px 40px;text-align:center">
                        <span style="font-size:22px;font-weight:700;color:#ffffff">
                          <span style="color:#dc2626">%s</span><span style="color:#38bdf8">%s</span>
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:40px">
                        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1e3a5f">🎉 Beklediğiniz Ürün Stoğa Geldi!</p>
                        <p style="margin:0 0 20px;font-size:15px;color:#64748b;line-height:1.6">
                          Haber verilmesini istediğiniz ürün artık tekrar stoklarımızda.
                        </p>

                        <div style="background:#f1f5f9;border-radius:10px;padding:18px;margin-bottom:24px">
                          <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#1a1a1a">%s</p>
                          %s
                        </div>

                        <div style="text-align:center;margin-bottom:28px">
                          <a href="%s" style="display:inline-block;background:#dc2626;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px">
                            Ürünü Görüntüle
                          </a>
                        </div>

                        <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6">
                          Stoklar sınırlı olabilir — hızlı davranmanızı öneririz. Bu e-postayı siz talep ettiniz, tekrar bildirim almayacaksınız.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
                        <p style="margin:0;font-size:12px;color:#94a3b8">© %s %s · %s</p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(appNamePart1(), appNamePart2(), productName, variantLine, productUrl, appYear(), appName(), appDomain());
    }

    public String buildEmailChangeEmail(String firstName, String confirmUrl) {
        return """
            <!DOCTYPE html>
            <html lang="tr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:40px 0">
                <tr><td align="center">
                  <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)">

                    <tr>
                      <td style="background:#1e3a5f;padding:28px 40px;text-align:center">
                        <span style="font-size:22px;font-weight:700;color:#ffffff">
                          <span style="color:#dc2626">%s</span><span style="color:#38bdf8">%s</span>
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:40px">
                        <p style="margin:0 0 16px;font-size:16px;color:#1a1a1a">Merhaba <strong>%s</strong>,</p>
                        <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6">
                          %s hesabınızın e-posta adresini değiştirmek için bir istek aldık.
                          Aşağıdaki butona tıklayarak yeni e-posta adresinizi onaylayın.
                          Bu bağlantı <strong>24 saat</strong> geçerlidir.
                        </p>

                        <div style="text-align:center;margin-bottom:28px">
                          <a href="%s" style="display:inline-block;background:#dc2626;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px">
                            E-posta Adresimi Onayla
                          </a>
                        </div>

                        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8">
                          Bu işlemi siz yapmadıysanız bu e-postayı görmezden gelin. E-posta adresiniz değişmeyecektir.
                        </p>
                        <p style="margin:0;font-size:12px;color:#cbd5e1;word-break:break-all">
                          Buton çalışmıyorsa şu bağlantıyı kopyalayın: %s
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
                        <p style="margin:0;font-size:12px;color:#94a3b8">© %s %s · %s</p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(appNamePart1(), appNamePart2(), firstName, appName(), confirmUrl, confirmUrl, appYear(), appName(), appDomain());
    }
}
