/**
 * HTTP istek log'u (request_log tablosu) + onu yazan filter + 30 günlük temizlik job'u.
 * Cross-cutting telemetri — herhangi bir iş modülüne ait değil.
 */
@org.springframework.modulith.ApplicationModule(
        displayName = "telemetry",
        allowedDependencies = {}
)
package com.petshop.telemetry;
