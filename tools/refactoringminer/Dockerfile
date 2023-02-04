FROM amazoncorretto:17-alpine AS builder

WORKDIR /work

ARG VERSION=2.3.2
RUN apk add git --no-cache
RUN git clone --depth 1 --branch $VERSION https://github.com/tsantalis/RefactoringMiner
RUN cd ./RefactoringMiner && git checkout $VERSION
RUN cd ./RefactoringMiner && ./gradlew distZip
RUN cd ./RefactoringMiner/build/distributions && unzip RefactoringMiner-$VERSION.zip

FROM amazoncorretto:17-alpine AS runner

WORKDIR /work

ARG VERSION=$VERSION
ENV JVM_OPTS="-Xmx8g -Xms4g"

RUN mkdir /rm-home
COPY --from=builder /work/RefactoringMiner/build/distributions/RefactoringMiner-$VERSION/ /rm-home

ENTRYPOINT ["/rm-home/bin/RefactoringMiner"]
