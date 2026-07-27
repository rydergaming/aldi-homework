package com.rydergaming.app;

import org.junit.jupiter.api.AfterAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

public class TaskManagerTest {

    static ApiHelper api;

    static String env(String key, String fallback) {
        return System.getProperty(key, System.getenv().getOrDefault(key, fallback));
    }

    @BeforeAll
    static void setup() {
        api = new ApiHelper(
                env("URL", "http://localhost:8080"),
                env("UI_USERNAME", "student"),
                env("UI_PASSWORD", "Password123"));
    }

    @ParameterizedTest(name = "DELETE /task/{0} -> {1}")
    @CsvSource({
            "666,   404",
            "0,     400",
            "-1,    400",
            "kutya, 400"
    })
    void deleteRejectsInvalidTaskIds(String taskId, int expectedStatus) {
        assertEquals(expectedStatus, api.deleteTask(taskId).getStatus(), "Status code was not the exepected");
    }

    @AfterAll
    static void teardown() {
        if (api != null) {
            api.close();
        }
    }
}