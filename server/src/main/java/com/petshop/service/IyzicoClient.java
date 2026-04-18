package com.petshop.service;

import com.iyzipay.Options;
import com.iyzipay.model.CheckoutForm;
import com.iyzipay.model.CheckoutFormInitialize;
import com.iyzipay.request.CreateCheckoutFormInitializeRequest;
import com.iyzipay.request.RetrieveCheckoutFormRequest;
import com.petshop.config.IyzicoProperties;
import org.springframework.stereotype.Component;

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
}
