# Production image for the Trilane Tech API.
# Build:  docker build -t trilane-api ./backend
# Run:    docker run -p 8080:8080 --env-file prod.env -v trilane-uploads:/data/uploads trilane-api

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src src
RUN mvn -B -q package -DskipTests

FROM eclipse-temurin:21-jre
RUN groupadd --system app && useradd --system --gid app --home /app app \
    && mkdir -p /data/uploads && chown -R app:app /data
WORKDIR /app
COPY --from=build /app/target/trilane-api-1.0.0.jar app.jar
ENV SPRING_PROFILES_ACTIVE=prod \
    UPLOAD_DIR=/data/uploads \
    PORT=8080
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
