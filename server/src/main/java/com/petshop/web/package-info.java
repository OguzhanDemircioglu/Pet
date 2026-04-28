/**
 * Web aggregation modülü — birden fazla domain modülünün facade'larını çağırarak
 * kompozit endpoint'ler sunar (BFF / API Aggregator pattern).
 *
 * <p>Bu modül hiçbir entity, repository veya service sahip olmaz; sadece
 * {@link com.petshop.web.PublicController} (frontend için preload paketleri)
 * ve {@link com.petshop.web.BestSellerController} (catalog × order kompozisyonu)
 * gibi cross-module HTTP composition'larını barındırır.
 *
 * <p>Tek bir modüle ait olmadığı için domain modüllerinin (catalog/order/auth/...)
 * dışında konumlanır; ama "controller" flat'ı yerine açık modül olarak
 * tanımlandığı için Modulith {@code allowedDependencies} ile sınırları izole.
 */
@org.springframework.modulith.ApplicationModule(
        displayName = "web",
        allowedDependencies = {
                "auth :: api",
                "auth :: dto-response",
                "catalog :: api",
                "catalog :: dto-response",
                "order :: api",
                "pricing :: api",
                "pricing :: dto-response",
                "siteadmin :: api",
                "siteadmin :: dto-response",
                "dto",
                "constant"
        }
)
package com.petshop.web;
