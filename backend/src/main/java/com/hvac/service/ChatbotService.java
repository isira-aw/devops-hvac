package com.hvac.service;

import com.hvac.dto.ChatRequest;
import com.hvac.dto.ChatResponse;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
public class ChatbotService {

    private static final Logger logger = LoggerFactory.getLogger(ChatbotService.class);

    private final KnowledgeBaseService knowledgeBaseService;
    private final Gson gson = new Gson();
    private final HttpClient httpClient;

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.model}")
    private String groqModel;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    public ChatbotService(KnowledgeBaseService knowledgeBaseService) {
        this.knowledgeBaseService = knowledgeBaseService;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public ChatResponse chat(ChatRequest request) {
        String sessionId = request.getSessionId();
        if (sessionId == null || sessionId.isEmpty()) {
            sessionId = UUID.randomUUID().toString();
        }

        try {
            String reply = callGroqApi(request.getMessage(), request.getHistory());
            return new ChatResponse(reply, sessionId);
        } catch (Exception e) {
            logger.error("Error calling Groq API", e);
            return new ChatResponse(
                    "Sorry, I’m having trouble right now. Please try again later.",
                    sessionId
            );
        }
    }

    private String callGroqApi(String userMessage, List<ChatRequest.ChatMessage> history) throws Exception {

        String knowledgeContext = knowledgeBaseService.getKnowledgeContext();
        String systemPrompt = buildSystemPrompt(knowledgeContext);

        JsonObject requestBody = buildGroqRequest(systemPrompt, userMessage, history);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(groqApiUrl))
                .header("Authorization", "Bearer " + groqApiKey)
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(60))
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(requestBody)))
                .build();

        HttpResponse<String> response =
                httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            logger.error("Groq API error: status={}, body={}",
                    response.statusCode(), response.body());
            throw new RuntimeException("Groq API error");
        }

        return extractGroqResponse(response.body());
    }

    private JsonObject buildGroqRequest(
            String systemPrompt,
            String userMessage,
            List<ChatRequest.ChatMessage> history
    ) {

        JsonObject body = new JsonObject();
        body.addProperty("model", groqModel);
        body.addProperty("temperature", 1);
        body.addProperty("top_p", 1);
        body.addProperty("max_completion_tokens", 8192);

        JsonArray messages = new JsonArray();

        // ---- SYSTEM MESSAGE ----
        JsonObject systemMsg = new JsonObject();
        systemMsg.addProperty("role", "system");
        systemMsg.addProperty("content", systemPrompt);
        messages.add(systemMsg);

        // ---- CHAT HISTORY ----
        if (history != null && !history.isEmpty()) {
            for (ChatRequest.ChatMessage msg : history) {

                JsonObject m = new JsonObject();

                String role = msg.getRole();
                if ("model".equalsIgnoreCase(role)) {
                    role = "assistant";   // FIX for Groq
                } else if (!"user".equalsIgnoreCase(role) && !"assistant".equalsIgnoreCase(role)) {
                    role = "user";        // safety fallback
                }

                m.addProperty("role", role);
                m.addProperty("content", msg.getContent());
                messages.add(m);
            }
        }

        // ---- CURRENT USER MESSAGE ----
        JsonObject userMsg = new JsonObject();
        userMsg.addProperty("role", "user");
        userMsg.addProperty("content", userMessage);
        messages.add(userMsg);

        body.add("messages", messages);
        return body;
    }

    private String extractGroqResponse(String responseBody) {
        JsonObject json = gson.fromJson(responseBody, JsonObject.class);
        return json
                .getAsJsonArray("choices")
                .get(0).getAsJsonObject()
                .getAsJsonObject("message")
                .get("content").getAsString();
    }

    private String buildSystemPrompt(String knowledgeContext) {

        StringBuilder sb = new StringBuilder();

        sb.append("You are an expert HVAC support assistant for the Smart HVAC IoT Control System.\n\n");

        sb.append("IMPORTANT RESPONSE RULES:\n");
        sb.append("- Always give SHORT and DIRECT answers\n");
        sb.append("- Explanation must be VERY SHORT (1–2 lines only)\n");
        sb.append("- Use simple, clear language\n");
        sb.append("- Avoid long paragraphs\n");
        sb.append("- Prefer bullet points when possible\n");
        sb.append("- Do NOT give unnecessary technical depth\n");
        sb.append("- Focus on practical advice\n\n");

        sb.append("Response format:\n");
        sb.append("1. Short Answer (1 sentence)\n");
        sb.append("2. Short Explanation (1–2 short lines)\n\n");

        if (knowledgeContext != null && !knowledgeContext.isEmpty()) {
            sb.append("=== KNOWLEDGE BASE ===\n");
            sb.append(knowledgeContext);
            sb.append("\n=== END KNOWLEDGE BASE ===\n\n");
        }

        sb.append("If safety is involved, mention it briefly.\n");
        sb.append("If unsure, suggest contacting an HVAC technician.\n");

        return sb.toString();
    }

}
