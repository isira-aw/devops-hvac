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

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.model:gemini-2.0-flash}")
    private String geminiModel;

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
            String reply = callGeminiApi(request.getMessage(), request.getHistory());
            return new ChatResponse(reply, sessionId);
        } catch (Exception e) {
            logger.error("Error calling Gemini API: {}", e.getMessage(), e);
            return new ChatResponse(
                    "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
                    sessionId
            );
        }
    }

    private String callGeminiApi(String userMessage, List<ChatRequest.ChatMessage> history) throws Exception {
        String knowledgeContext = knowledgeBaseService.getKnowledgeContext();

        String systemPrompt = buildSystemPrompt(knowledgeContext);

        String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel, geminiApiKey
        );

        JsonObject requestBody = buildGeminiRequest(systemPrompt, userMessage, history);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(requestBody)))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            logger.error("Gemini API error: status={}, body={}", response.statusCode(), response.body());
            throw new RuntimeException("Gemini API returned status " + response.statusCode());
        }

        return extractResponseText(response.body());
    }

    private String buildSystemPrompt(String knowledgeContext) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert HVAC (Heating, Ventilation, and Air Conditioning) support assistant ");
        sb.append("for the Smart HVAC IoT Control System. Your role is to provide helpful, accurate, and ");
        sb.append("professional support for:\n\n");
        sb.append("- AC control and operations\n");
        sb.append("- HVAC system management and troubleshooting\n");
        sb.append("- Technical support for HVAC equipment\n");
        sb.append("- Customer support related to HVAC operations\n");
        sb.append("- Energy efficiency and optimization advice\n");
        sb.append("- System maintenance and scheduling\n\n");
        sb.append("Guidelines:\n");
        sb.append("- Be concise but thorough in your responses\n");
        sb.append("- Provide actionable advice when possible\n");
        sb.append("- If you're unsure, recommend contacting a professional HVAC technician\n");
        sb.append("- Always prioritize safety in your recommendations\n");
        sb.append("- Use the knowledge base information provided below when relevant\n\n");

        if (!knowledgeContext.isEmpty()) {
            sb.append("=== KNOWLEDGE BASE ===\n");
            sb.append(knowledgeContext);
            sb.append("\n=== END KNOWLEDGE BASE ===\n\n");
        }

        sb.append("Answer questions based on the knowledge base when available. ");
        sb.append("For general HVAC questions, use your expertise to help the customer.");

        return sb.toString();
    }

    private JsonObject buildGeminiRequest(String systemPrompt, String userMessage, List<ChatRequest.ChatMessage> history) {
        JsonObject requestBody = new JsonObject();

        // System instruction
        JsonObject systemInstruction = new JsonObject();
        JsonArray systemParts = new JsonArray();
        JsonObject systemTextPart = new JsonObject();
        systemTextPart.addProperty("text", systemPrompt);
        systemParts.add(systemTextPart);
        systemInstruction.add("parts", systemParts);
        requestBody.add("systemInstruction", systemInstruction);

        // Contents (conversation history + current message)
        JsonArray contents = new JsonArray();

        // Add conversation history
        if (history != null && !history.isEmpty()) {
            for (ChatRequest.ChatMessage msg : history) {
                JsonObject content = new JsonObject();
                content.addProperty("role", "user".equals(msg.getRole()) ? "user" : "model");
                JsonArray parts = new JsonArray();
                JsonObject textPart = new JsonObject();
                textPart.addProperty("text", msg.getContent());
                parts.add(textPart);
                content.add("parts", parts);
                contents.add(content);
            }
        }

        // Add current user message
        JsonObject userContent = new JsonObject();
        userContent.addProperty("role", "user");
        JsonArray userParts = new JsonArray();
        JsonObject userTextPart = new JsonObject();
        userTextPart.addProperty("text", userMessage);
        userParts.add(userTextPart);
        userContent.add("parts", userParts);
        contents.add(userContent);

        requestBody.add("contents", contents);

        // Generation config
        JsonObject generationConfig = new JsonObject();
        generationConfig.addProperty("temperature", 0.7);
        generationConfig.addProperty("topP", 0.95);
        generationConfig.addProperty("topK", 40);
        generationConfig.addProperty("maxOutputTokens", 1024);
        requestBody.add("generationConfig", generationConfig);

        return requestBody;
    }

    private String extractResponseText(String responseBody) {
        JsonObject response = gson.fromJson(responseBody, JsonObject.class);
        return response
                .getAsJsonArray("candidates")
                .get(0).getAsJsonObject()
                .getAsJsonObject("content")
                .getAsJsonArray("parts")
                .get(0).getAsJsonObject()
                .get("text").getAsString();
    }
}
