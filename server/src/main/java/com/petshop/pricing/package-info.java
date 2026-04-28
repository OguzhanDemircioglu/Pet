@org.springframework.modulith.ApplicationModule(
        displayName = "Pricing",
        allowedDependencies = {
                "catalog :: api",
                "siteadmin :: dto-response",
                "dto",
                "exception",
                "constant"
        }
)
package com.petshop.pricing;
