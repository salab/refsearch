FROM gradle:8.6.0-jdk17 AS builder

WORKDIR /work

# cache dependencies
COPY build.gradle.kts settings.gradle.kts gradle ./
RUN gradle build --no-daemon || return 0

COPY . .
RUN gradle jar --no-daemon


FROM amazoncorretto:17 AS runner

WORKDIR /work

RUN yum install -y git

RUN mkdir -p /jars
COPY --from=builder /work/build/libs/rminer.jar /jars/

ENTRYPOINT ["java", "-Xmx8g", "-Xms4g", "-jar", "/jars/rminer.jar"]
