@org.springframework.modulith.ApplicationModule(
        displayName = "Payment",
        allowedDependencies = {
                "auth :: api",
                "catalog :: api",
                "order :: api",
                "order :: dto-request",
                "order :: constant",
                "invoice :: api",
                "notification :: api",
                "dto",
                "exception",
                "constant"
        }
)
package com.petshop.payment;
