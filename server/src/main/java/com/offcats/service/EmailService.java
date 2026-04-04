package com.offcats.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail-from:info@offcats.com.tr}")
    private String fromEmail;

    public void sendVerificationCode(String toEmail, String firstName, String code) {
        String subject = "OffCats — E-posta Doğrulama Kodunuz";
        String html = buildVerificationEmail(firstName, code);
        sendHtml(toEmail, subject, html);
    }

    private void sendHtml(String to, String subject, String html) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromEmail, "OffCats");
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

    private String buildVerificationEmail(String firstName, String code) {
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
                          OffCats hesabınızı doğrulamak için aşağıdaki 6 haneli kodu kullanın.
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
                        <p style="margin:0;font-size:12px;color:#94a3b8">© 2024 OffCats · offcats.com.tr</p>
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
