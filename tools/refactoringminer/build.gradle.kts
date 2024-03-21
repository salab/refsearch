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

    val jacksonVersion = "2.17.0"
    implementation("com.fasterxml.jackson.core:jackson-core:${jacksonVersion}")
    implementation("com.fasterxml.jackson.core:jackson-databind:${jacksonVersion}")
    implementation("com.fasterxml.jackson.core:jackson-annotations:${jacksonVersion}")

    val rminerVersion = "2.4.0"
    implementation("com.github.tsantalis:refactoring-miner:${rminerVersion}")
    implementation("org.eclipse.jgit:org.eclipse.jgit:5.13.1.202206130422-r") // should be synced with RMiner's dependent version
}

tasks.withType<Jar> {
    archiveFileName.set("rminer.jar")
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
