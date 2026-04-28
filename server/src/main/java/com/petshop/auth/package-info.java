@org.springframework.modulith.ApplicationModule(
        displayName = "Auth",
        allowedDependencies = {
                "notification :: api",
                "dto",
                "exception",
                "constant"
        }
)
package com.petshop.auth;
