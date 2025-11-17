FROM gradle:8-jdk21-alpine AS builder
WORKDIR /app
COPY settings.gradle .
COPY build.gradle .
RUN gradle dependencies --no-daemon
COPY src src
RUN gradle clean bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8000
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

