# ── Build stage ──────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Bağımlılıkları önce indir (cache için)
COPY pom.xml .
RUN mvn dependency:go-offline -B -q

# Kaynak kodu kopyala ve derle
COPY src ./src
RUN mvn clean package -DskipTests -B -q

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN mkdir -p /uploads/products

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Xmx450m", "-Xms200m", "-jar", "app.jar"]
