package com.petshop.web;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * IP bazlı in-memory rate limiter — yalnızca yüksek riskli auth endpoint'leri
 * için aktif. Distributed bir setup'ta Redis-backed Bucket4j'e geçilebilir.
 *
 * Limitler:
 *   /auth/login                  → 10 req / dakika / IP  (brute force koruma)
 *   /auth/register, /register-company → 5 req / dakika / IP (spam koruma)
 *   /auth/refresh, /verify-email      → 30 req / dakika / IP
 */
@Component
@Order(0) // JwtAuthFilter'dan önce çalışır
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Map<String, Bucket> BUCKETS = new ConcurrentHashMap<>();

    private static class Limit {
        final String prefix;
        final Bandwidth bw;
        Limit(String p, int capacity, Duration period) {
            this.prefix = p;
            this.bw = Bandwidth.builder().capacity(capacity).refillGreedy(capacity, period).build();
        }
    }

    private static final Limit[] LIMITS = new Limit[] {
            new Limit("/auth/login",                  10, Duration.ofMinutes(1)),
            new Limit("/auth/register-company",        5, Duration.ofMinutes(1)),
            new Limit("/auth/register",                5, Duration.ofMinutes(1)),
            new Limit("/auth/password-reset",          5, Duration.ofMinutes(1)),
            new Limit("/auth/password-reset/confirm", 10, Duration.ofMinutes(1)),
            new Limit("/auth/refresh",                30, Duration.ofMinutes(1)),
            new Limit("/auth/verify-email",           20, Duration.ofMinutes(1)),
            new Limit("/auth/google",                 20, Duration.ofMinutes(1)),
    };

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        if ("POST".equalsIgnoreCase(req.getMethod())) {
            String path = req.getRequestURI();
            for (Limit l : LIMITS) {
                if (path.equals(l.prefix) || path.startsWith(l.prefix + "/")) {
                    String key = clientIp(req) + "|" + l.prefix;
                    Bucket bucket = BUCKETS.computeIfAbsent(key, k -> Bucket.builder().addLimit(l.bw).build());
                    var probe = bucket.tryConsumeAndReturnRemaining(1);
                    if (!probe.isConsumed()) {
                        long waitSec = probe.getNanosToWaitForRefill() / 1_000_000_000L;
                        log.warn("Rate limit aşıldı: ip={} path={} wait={}s", clientIp(req), path, waitSec);
                        res.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                        res.setHeader("Retry-After", String.valueOf(Math.max(1, waitSec)));
                        res.setContentType("application/json");
                        res.getWriter().write("{\"success\":false,\"message\":\"Çok fazla istek. Lütfen biraz bekleyin.\",\"errors\":{\"code\":\"RATE_LIMIT\"}}");
                        return;
                    }
                    res.setHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
                    break;
                }
            }
        }
        chain.doFilter(req, res);
    }

    private String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            int comma = xff.indexOf(',');
            return (comma < 0 ? xff : xff.substring(0, comma)).trim();
        }
        String real = req.getHeader("X-Real-IP");
        if (real != null && !real.isBlank()) return real.trim();
        return req.getRemoteAddr();
    }

    /** Test'lerin temiz başlaması için */
    public static void clearForTesting() {
        BUCKETS.clear();
    }
}
