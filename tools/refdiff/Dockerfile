FROM gradle:7.5.1-jdk17 AS builder

WORKDIR /work

# cache dependencies
COPY build.gradle.kts settings.gradle.kts gradle ./
RUN gradle build --no-daemon || return 0

COPY . .
RUN gradle jar --no-daemon

FROM amazoncorretto:17 AS runner

ARG VERSION=2.0.0

WORKDIR /work

RUN yum install -y git

# For refdiff-js
# amazoncorretto:17-alpine はよくわからない壊れ方をする (jdk crashes)
# node v18 は glibc 2.27 or 2.28 が必要 (amazoncorretto:17 には 2.26 が入っている)
RUN curl -sL https://rpm.nodesource.com/setup_16.x | bash -
RUN yum install -y nodejs && \
    yum clean all

RUN mkdir -p /jars
COPY --from=builder /work/build/libs/refdiff.jar /jars/

ENTRYPOINT ["java", "-Xmx8g", "-Xms4g", "-jar", "/jars/refdiff.jar"]
