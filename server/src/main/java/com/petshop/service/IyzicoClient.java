package com.petshop.service;

import com.iyzipay.Options;
import com.iyzipay.model.CheckoutForm;
import com.iyzipay.model.CheckoutFormInitialize;
import com.iyzipay.model.Locale;
import com.iyzipay.model.Refund;
import com.iyzipay.request.CreateCheckoutFormInitializeRequest;
import com.iyzipay.request.CreateRefundRequest;
import com.iyzipay.request.RetrieveCheckoutFormRequest;
import com.petshop.config.IyzicoProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * iyzipay SDK'yı saran ince wrapper.
 * Static metotları instance üzerinden çağırır — test edilebilir ve mocklanabilir.
 */
@Component
public class IyzicoClient {

    private final Options options;

    public IyzicoClient(IyzicoProperties props) {
        options = new Options();
        options.setApiKey(props.apiKey());
        options.setSecretKey(props.secretKey());
        options.setBaseUrl(props.baseUrl());
    }

    public CheckoutFormInitialize initializeForm(CreateCheckoutFormInitializeRequest request) {
        return CheckoutFormInitialize.create(request, options);
    }

    public CheckoutForm retrieveForm(RetrieveCheckoutFormRequest request) {
        return CheckoutForm.retrieve(request, options);
    }

    /**
     * Bir iyzico ödemesine ait tüm itemleri iade eder (full refund).
     * CheckoutForm ile alınan ödemenin her paymentTransactionId'si ayrı ayrı iade edilmelidir.
     */
    public Refund refundTransaction(String paymentTransactionId, BigDecimal amount, String ip) {
        CreateRefundRequest req = new CreateRefundRequest();
        req.setLocale(Locale.TR.getValue());
        req.setConversationId(paymentTransactionId);
        req.setPaymentTransactionId(paymentTransactionId);
        req.setPrice(amount);
        req.setIp(ip != null ? ip : "127.0.0.1");
        return Refund.create(req, options);
    }

    /** Ödeme detaylarını (itemTransactions dahil) çeker — refund için paymentTransactionId almak gerek. */
    public com.iyzipay.model.Payment retrievePayment(String paymentId) {
        com.iyzipay.request.RetrievePaymentRequest r = new com.iyzipay.request.RetrievePaymentRequest();
        r.setLocale(Locale.TR.getValue());
        r.setPaymentId(paymentId);
        r.setPaymentConversationId(paymentId);
        return com.iyzipay.model.Payment.retrieve(r, options);
    }
}
