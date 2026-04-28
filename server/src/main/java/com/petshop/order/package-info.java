@org.springframework.modulith.ApplicationModule(
        displayName = "Order",
        allowedDependencies = {
                "auth :: api",
                "catalog :: api",
                "notification :: api",
                "dto",
                "exception",
                "constant"
        }
)
package com.petshop.order;
