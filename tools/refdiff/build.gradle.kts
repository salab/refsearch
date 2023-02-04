plugins {
    id("java")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
}

group = ""
version = ""

repositories {
    mavenCentral()
}

dependencies {
    implementation("net.sourceforge.argparse4j:argparse4j:0.9.0")

    val jacksonVersion = "2.13.4"
    implementation("com.fasterxml.jackson.core:jackson-core:${jacksonVersion}")
    implementation("com.fasterxml.jackson.core:jackson-databind:${jacksonVersion}")
    implementation("com.fasterxml.jackson.core:jackson-annotations:${jacksonVersion}")

    val refDiffVersion = "2.0.0"
    implementation("com.github.aserg-ufmg:refdiff-java:${refDiffVersion}")
    implementation("com.github.aserg-ufmg:refdiff-js:${refDiffVersion}")
    implementation("com.github.aserg-ufmg:refdiff-c:${refDiffVersion}")

    implementation(fileTree(mapOf("dir" to "libs", "include" to arrayOf("*.jar"))))
}

tasks.withType<Jar> {
    archiveFileName.set("refdiff.jar")
    manifest {
        attributes["Main-Class"] = "Main"
    }
    // Exclude jar signs
    exclude("META-INF/*.SF", "META-INF/*.DSA", "META-INF/*.RSA", "META-INF/*.MF")
    val dependencies = configurations
            .runtimeClasspath
            .get()
            .map(::zipTree)
    from(dependencies)
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}
