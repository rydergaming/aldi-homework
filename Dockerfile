# Runs the Java (Selenium HTTP client) API suite in testing/selenium.
# Built from the repository root, so paths below are repo-relative.
FROM maven:3.9-eclipse-temurin-17

WORKDIR /tests

# Dependencies resolve in their own layer: as long as pom.xml is unchanged,
# editing a test reuses the cached layer instead of refetching every jar.
COPY testing/selenium/pom.xml ./
RUN mvn -B dependency:go-offline

COPY testing/selenium/src ./src

# URL, UI_USERNAME and UI_PASSWORD are supplied at runtime by docker-compose.yml
CMD ["mvn", "-B", "test"]
