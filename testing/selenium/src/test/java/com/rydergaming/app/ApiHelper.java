package com.rydergaming.app;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

import org.openqa.selenium.remote.http.ClientConfig;
import org.openqa.selenium.remote.http.HttpClient;
import org.openqa.selenium.remote.http.HttpMethod;
import org.openqa.selenium.remote.http.HttpRequest;
import org.openqa.selenium.remote.http.HttpResponse;

public class ApiHelper implements AutoCloseable {

    private static final String API_PATH = "/api/v1";

    private final HttpClient client;
    private final String authHeader;

    public ApiHelper(String baseUri, String username, String password) {
        ClientConfig config = ClientConfig.defaultConfig()
                .baseUri(URI.create(baseUri))
                .connectionTimeout(Duration.ofSeconds(10))
                .readTimeout(Duration.ofSeconds(30));
        this.client = HttpClient.Factory.createDefault().createClient(config);
        this.authHeader = "Basic " + Base64.getEncoder()
                .encodeToString((username + ":" + password).getBytes(StandardCharsets.UTF_8));
    }

    private HttpRequest request(HttpMethod method, String path) {
        return new HttpRequest(method, API_PATH + path)
                .addHeader("Authorization", authHeader)
                .addHeader("Accept", "application/json");
    }

    public HttpResponse deleteTask(String taskId) {
        return client.execute(request(HttpMethod.DELETE, "/task/" + taskId));
    }

    @Override
    public void close() {
        client.close();
    }
}