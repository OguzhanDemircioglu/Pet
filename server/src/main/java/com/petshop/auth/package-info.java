@org.springframework.modulith.ApplicationModule(
        displayName = "Auth",
        allowedDependencies = {
                "notification :: api",
                "dto",
                "exception",
                "constant",
                "tenant"
        }
)
package com.petshop.auth;
