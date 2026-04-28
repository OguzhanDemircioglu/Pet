@org.springframework.modulith.ApplicationModule(
        displayName = "Review",
        allowedDependencies = {
                "catalog :: api",
                "order :: api",
                "auth :: api",
                "dto",
                "exception",
                "constant"
        }
)
package com.petshop.review;
