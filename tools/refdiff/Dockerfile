FROM gradle:8.6.0-jdk21 AS builder

WORKDIR /work

# cache dependencies
COPY build.gradle.kts settings.gradle.kts gradle ./
RUN gradle build --no-daemon || return 0

COPY . .
RUN gradle jar --no-daemon


FROM amazoncorretto:21 AS runner

WORKDIR /work

RUN yum install -y git

# For refdiff-js
# With amazoncorretto:21-alpine, jdk crashes for some reason
# node v18 needs glibc 2.27 or 2.28 (meanwhile amazoncorretto:17 has 2.26)
RUN curl -sL https://rpm.nodesource.com/setup_16.x | bash -
RUN yum install -y nodejs && \
    yum clean all

RUN mkdir -p /jars
COPY --from=builder /work/build/libs/refdiff.jar /jars/

ENTRYPOINT ["java", "-Xmx8g", "-Xms4g", "-jar", "/jars/refdiff.jar"]
