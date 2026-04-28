@org.springframework.modulith.ApplicationModule(
        displayName = "invoice",
        allowedDependencies = {
                "order :: api",
                "auth :: api",
                "dto",
                "exception",
                "constant"
        }
)
package com.petshop.invoice;
