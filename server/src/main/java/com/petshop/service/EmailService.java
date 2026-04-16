package com.petshop.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail-from:info@patilyapetshop.com.tr}")
    private String fromEmail;

    void sendHtml(String to, String subject, String html) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromEmail, "PatilyaPetshop");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(msg);
            log.info("Email gönderildi → {}", to);
        } catch (MessagingException e) {
            log.error("Email gönderilemedi → {}: {}", to, e.getMessage());
        } catch (Exception e) {
            log.error("Email servis hatası: {}", e.getMessage());
        }
    }

    String buildOrderConfirmationEmail(String firstName, Long orderId,
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
                          <span style="color:#dc2626">Pet</span><span style="color:#38bdf8">Toptan</span>
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
                        <p style="margin:0;font-size:12px;color:#94a3b8">© 2024 PetToptan · pettoptan.com.tr</p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(firstName, orderId, itemsHtml, totalAmount, deliveryAddress);
    }

    String buildVerificationEmail(String firstName, String code) {
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
                          <span style="color:#dc2626">Pet</span><span style="color:#38bdf8">Toptan</span>
                        </span>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:40px">
                        <p style="margin:0 0 16px;font-size:16px;color:#1a1a1a">Merhaba <strong>%s</strong>,</p>
                        <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6">
                          PatilyaPetshop hesabınızı doğrulamak için aşağıdaki 6 haneli kodu kullanın.
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
                        <p style="margin:0;font-size:12px;color:#94a3b8">© 2024 PatilyaPetshop · patilyapetshop.com.tr</p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(firstName, code);
    }
}
