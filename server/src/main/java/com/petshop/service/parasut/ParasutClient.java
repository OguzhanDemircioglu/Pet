package com.petshop.service.parasut;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.petshop.config.ParasutProperties;
import com.petshop.entity.Order;
import com.petshop.entity.OrderItem;
import com.petshop.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Paraşüt v4 API istemcisi.
 * OAuth2 password grant ile token alır, cache'ler. Contact + SalesInvoice + e-Arşiv/e-Fatura + Cancel.
 * Dokümantasyon: https://apidocs.parasut.com
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ParasutClient {

    private final ParasutProperties props;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    private String accessToken;
    private LocalDateTime tokenExpiresAt;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    // ───────────────────────────── OAuth ──────────────────────────────

    public synchronized String getAccessToken() {
        if (accessToken != null && tokenExpiresAt != null
                && LocalDateTime.now().isBefore(tokenExpiresAt.minusMinutes(5))) {
            return accessToken;
        }
        return refreshToken();
    }

    private String refreshToken() {
        String url = "https://api.parasut.com/oauth/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", props.clientId());
        body.add("client_secret", props.clientSecret());
        body.add("username", props.username());
        body.add("password", props.password());
        body.add("redirect_uri", "urn:ietf:wg:oauth:2.0:oob");

        HttpEntity<MultiValueMap<String, String>> req = new HttpEntity<>(body, headers);
        ResponseEntity<String> resp = restTemplate.postForEntity(url, req, String.class);

        try {
            JsonNode root = mapper.readTree(resp.getBody());
            accessToken = root.path("access_token").asText();
            int expiresIn = root.path("expires_in").asInt(7200);
            tokenExpiresAt = LocalDateTime.now().plusSeconds(expiresIn);
            log.info("Paraşüt OAuth token alındı — geçerlilik: {} dk", expiresIn / 60);
            return accessToken;
        } catch (Exception e) {
            throw new RuntimeException("Paraşüt token parse hatası: " + e.getMessage(), e);
        }
    }

    private HttpHeaders authJsonHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.setBearerAuth(getAccessToken());
        return h;
    }

    private String base() {
        return props.baseUrl() + "/" + props.companyId();
    }

    // ─────────────────────────── Contact ──────────────────────────────

    /**
     * Paraşüt'te müşteri (contact) oluşturur. VKN/TCKN varsa önce ara, yoksa oluştur.
     */
    public String createOrFindContact(Order order) {
        String idNo = order.getInvoiceIdentityNo();
        if (idNo != null && !idNo.isBlank()) {
            String existing = findContactByTaxNumber(idNo);
            if (existing != null) return existing;
        }
        return createContact(order);
    }

    private String findContactByTaxNumber(String taxNumber) {
        try {
            String url = base() + "/contacts?filter[tax_number]=" + taxNumber;
            HttpEntity<Void> req = new HttpEntity<>(authJsonHeaders());
            ResponseEntity<String> resp = restTemplate.exchange(url, HttpMethod.GET, req, String.class);
            JsonNode data = mapper.readTree(resp.getBody()).path("data");
            if (data.isArray() && data.size() > 0) {
                return data.get(0).path("id").asText();
            }
        } catch (Exception e) {
            log.warn("Paraşüt contact arama başarısız: {}", e.getMessage());
        }
        return null;
    }

    private String createContact(Order order) {
        boolean corporate = isCorporate(order);
        User user = order.getUser();

        Map<String, Object> attributes = new LinkedHashMap<>();
        attributes.put("name", corporate ? order.getInvoiceTitle() : fullName(order, user));
        attributes.put("email", user != null ? user.getEmail() : order.getGuestEmail());
        attributes.put("contact_type", corporate ? "company" : "person");
        attributes.put("account_type", "customer");
        if (order.getInvoiceIdentityNo() != null) {
            attributes.put("tax_number", order.getInvoiceIdentityNo());
        }
        if (corporate && order.getInvoiceTaxOffice() != null) {
            attributes.put("tax_office", order.getInvoiceTaxOffice());
        }
        attributes.put("city", order.getInvoiceCity());
        attributes.put("district", order.getInvoiceDistrict());
        attributes.put("address", order.getInvoiceAddress());

        Map<String, Object> body = Map.of(
                "data", Map.of(
                        "type", "contacts",
                        "attributes", attributes
                )
        );

        try {
            String url = base() + "/contacts";
            HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, authJsonHeaders());
            ResponseEntity<String> resp = restTemplate.postForEntity(url, req, String.class);
            String id = mapper.readTree(resp.getBody()).path("data").path("id").asText();
            log.info("Paraşüt contact oluşturuldu: {} — sipariş #{}", id, order.getId());
            return id;
        } catch (HttpStatusCodeException e) {
            throw new RuntimeException("Paraşüt contact oluşturma hatası: "
                    + e.getStatusCode() + " — " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("Paraşüt contact oluşturma hatası: " + e.getMessage(), e);
        }
    }

    // ─────────────────────────── Sales Invoice ─────────────────────────

    /**
     * Satış faturası oluşturur. Ürün ve fatura kalemleri birlikte post edilir.
     * Paraşüt: POST /sales_invoices — details içinde product oluşturmak yerine
     * item_type="service" olan inline kalemler kullanıyoruz (basit: ürün senkronu gerektirmiyor).
     */
    public String createSalesInvoice(Order order, String contactId) {
        List<Map<String, Object>> details = new ArrayList<>();
        for (int i = 0; i < order.getItems().size(); i++) {
            OrderItem item = order.getItems().get(i);
            BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
            Map<String, Object> detail = new LinkedHashMap<>();
            detail.put("type", "sales_invoice_details");
            detail.put("attributes", Map.of(
                    "quantity", item.getQuantity(),
                    "unit_price", unitPrice,
                    "vat_rate", 20,           // KDV %20 sabit
                    "discount_value", 0,
                    "description", item.getProductName()
            ));
            details.add(detail);
        }

        Map<String, Object> attributes = new LinkedHashMap<>();
        attributes.put("item_type", "invoice");
        attributes.put("description", "Sipariş #" + order.getOrderNumber());
        attributes.put("issue_date", LocalDate.now().format(DATE_FMT));
        attributes.put("due_date", LocalDate.now().format(DATE_FMT));
        attributes.put("invoice_series", "");
        attributes.put("currency", "TRL");

        Map<String, Object> relationships = Map.of(
                "contact", Map.of(
                        "data", Map.of("id", contactId, "type", "contacts")
                ),
                "details", Map.of("data", details)
        );

        Map<String, Object> body = Map.of(
                "data", Map.of(
                        "type", "sales_invoices",
                        "attributes", attributes,
                        "relationships", relationships
                )
        );

        try {
            String url = base() + "/sales_invoices";
            HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, authJsonHeaders());
            ResponseEntity<String> resp = restTemplate.postForEntity(url, req, String.class);
            String id = mapper.readTree(resp.getBody()).path("data").path("id").asText();
            log.info("Paraşüt fatura oluşturuldu: {} — sipariş #{}", id, order.getId());
            return id;
        } catch (HttpStatusCodeException e) {
            throw new RuntimeException("Paraşüt fatura oluşturma hatası: "
                    + e.getStatusCode() + " — " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("Paraşüt fatura oluşturma hatası: " + e.getMessage(), e);
        }
    }

    // ───────────────────────── e-Belge (Archive / Fatura) ─────────────

    /**
     * Sales invoice'tan e-Arşiv (corporate=false) veya e-Fatura (corporate=true) belgesi üretir.
     * Returns: e-belge id (status polling için).
     */
    public String createEDocument(String invoiceId, boolean corporate) {
        String path = corporate ? "/e_invoices" : "/e_archives";
        Map<String, Object> body = Map.of(
                "data", Map.of(
                        "type", corporate ? "e_invoices" : "e_archives",
                        "attributes", Map.of(
                                "vat_withholding_code", "",
                                "vat_exemption_reason_code", "",
                                "vat_exemption_reason", "",
                                "note", "",
                                "internet_sale", Map.of(
                                        "url", "",
                                        "payment_type", "KREDIKARTI/BANKAKARTI",
                                        "payment_platform", "iyzico",
                                        "payment_date", LocalDate.now().format(DATE_FMT)
                                )
                        ),
                        "relationships", Map.of(
                                "invoice", Map.of(
                                        "data", Map.of("id", invoiceId, "type", "sales_invoices")
                                )
                        )
                )
        );

        try {
            String url = base() + path;
            HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, authJsonHeaders());
            ResponseEntity<String> resp = restTemplate.postForEntity(url, req, String.class);
            String id = mapper.readTree(resp.getBody()).path("data").path("id").asText();
            log.info("Paraşüt e-belge oluşturuldu ({}): {} — invoice {}",
                    corporate ? "e-Fatura" : "e-Arşiv", id, invoiceId);
            return id;
        } catch (HttpStatusCodeException e) {
            throw new RuntimeException("Paraşüt e-belge oluşturma hatası: "
                    + e.getStatusCode() + " — " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("Paraşüt e-belge oluşturma hatası: " + e.getMessage(), e);
        }
    }

    // ───────────────────────────── Cancel ─────────────────────────────

    public void cancelInvoice(String invoiceId) {
        try {
            String url = base() + "/sales_invoices/" + invoiceId + "/cancel";
            HttpEntity<Void> req = new HttpEntity<>(authJsonHeaders());
            restTemplate.exchange(url, HttpMethod.DELETE, req, String.class);
            log.info("Paraşüt fatura iptal edildi: {}", invoiceId);
        } catch (HttpStatusCodeException e) {
            throw new RuntimeException("Paraşüt fatura iptal hatası: "
                    + e.getStatusCode() + " — " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("Paraşüt fatura iptal hatası: " + e.getMessage(), e);
        }
    }

    // ───────────────────────────── PDF URL ────────────────────────────

    public String getInvoicePdfUrl(String invoiceId) {
        try {
            String url = base() + "/sales_invoices/" + invoiceId + "?include=active_e_document";
            HttpEntity<Void> req = new HttpEntity<>(authJsonHeaders());
            ResponseEntity<String> resp = restTemplate.exchange(url, HttpMethod.GET, req, String.class);
            JsonNode root = mapper.readTree(resp.getBody());
            JsonNode included = root.path("included");
            if (included.isArray()) {
                for (JsonNode node : included) {
                    String url2 = node.path("attributes").path("url").asText(null);
                    if (url2 != null && !url2.isBlank()) return url2;
                }
            }
        } catch (Exception e) {
            log.warn("Paraşüt PDF URL alınamadı: {}", e.getMessage());
        }
        return null;
    }

    // ───────────────────────────── Helpers ────────────────────────────

    private boolean isCorporate(Order order) {
        return order.getInvoiceType() == Order.InvoiceType.CORPORATE;
    }

    private String fullName(Order order, User user) {
        if (user != null && user.getFirstName() != null) {
            String last = user.getLastName() != null ? user.getLastName() : "";
            return (user.getFirstName() + " " + last).trim();
        }
        return order.getGuestName() != null ? order.getGuestName() : "Müşteri";
    }
}
