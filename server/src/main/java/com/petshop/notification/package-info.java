@org.springframework.modulith.ApplicationModule(
        displayName = "Notification",
        allowedDependencies = {
                "catalog :: api",
                "catalog :: events",
                "siteadmin :: api",
                "dto",
                "exception",
                "constant"
        }
)
package com.petshop.notification;
