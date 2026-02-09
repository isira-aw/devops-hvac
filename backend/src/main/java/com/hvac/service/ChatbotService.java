package com.hvac.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.hvac.dto.*;
import com.hvac.entity.ChatbotKnowledge;
import com.hvac.repository.ChatbotKnowledgeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatbotService {

    private static final Logger logger = LoggerFactory.getLogger(ChatbotService.class);

    private final ChatbotKnowledgeRepository knowledgeRepository;
    private final HttpClient httpClient;
    private final Gson gson;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.model:gemini-2.0-flash}")
    private String geminiModel;

    public ChatbotService(ChatbotKnowledgeRepository knowledgeRepository) {
        this.knowledgeRepository = knowledgeRepository;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.gson = new Gson();
    }

    // ==================== Chat ====================

    public ChatResponse chat(ChatRequest request) {
        try {
            String knowledgeContext = buildKnowledgeContext();
            String geminiResponse = callGeminiApi(knowledgeContext, request.getMessage(), request.getHistory());
            return new ChatResponse(geminiResponse);
        } catch (Exception e) {
            logger.error("Error processing chat request: {}", e.getMessage(), e);
            return new ChatResponse("I'm sorry, I'm having trouble processing your request right now. Please try again later.");
        }
    }

    private String buildKnowledgeContext() {
        List<ChatbotKnowledge> entries = knowledgeRepository.findByIsActiveTrue();
        if (entries.isEmpty()) {
            return "No specific knowledge base available. Answer based on general HVAC knowledge.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("=== HVAC KNOWLEDGE BASE ===\n\n");
        for (ChatbotKnowledge entry : entries) {
            sb.append("--- ").append(entry.getCategory().toUpperCase())
              .append(": ").append(entry.getTitle()).append(" ---\n");
            sb.append(entry.getContent()).append("\n\n");
        }
        return sb.toString();
    }

    private String callGeminiApi(String knowledgeContext, String userMessage, List<ChatRequest.ChatMessage> history) throws Exception {
        String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel, geminiApiKey
        );

        JsonObject requestBody = buildGeminiRequest(knowledgeContext, userMessage, history);

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

    private JsonObject buildGeminiRequest(String knowledgeContext, String userMessage, List<ChatRequest.ChatMessage> history) {
        JsonObject request = new JsonObject();
        JsonArray contents = new JsonArray();

        // System instruction with knowledge base context
        JsonObject systemInstruction = new JsonObject();
        JsonArray systemParts = new JsonArray();
        JsonObject systemText = new JsonObject();
        systemText.addProperty("text", buildSystemPrompt(knowledgeContext));
        systemParts.add(systemText);
        systemInstruction.add("parts", systemParts);
        request.add("systemInstruction", systemInstruction);

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
        JsonObject userText = new JsonObject();
        userText.addProperty("text", userMessage);
        userParts.add(userText);
        userContent.add("parts", userParts);
        contents.add(userContent);

        request.add("contents", contents);

        // Generation config for optimal performance
        JsonObject generationConfig = new JsonObject();
        generationConfig.addProperty("temperature", 0.7);
        generationConfig.addProperty("topP", 0.9);
        generationConfig.addProperty("topK", 40);
        generationConfig.addProperty("maxOutputTokens", 1024);
        request.add("generationConfig", generationConfig);

        return request;
    }

    private String buildSystemPrompt(String knowledgeContext) {
        return "You are an expert HVAC (Heating, Ventilation, and Air Conditioning) support assistant. " +
                "Your role is to help customers with:\n" +
                "- AC control and operations\n" +
                "- HVAC system management and troubleshooting\n" +
                "- Technical support for HVAC equipment\n" +
                "- Customer support related to HVAC services\n" +
                "- Energy efficiency tips and maintenance advice\n\n" +
                "IMPORTANT RULES:\n" +
                "1. Always use the knowledge base below as your PRIMARY source of information.\n" +
                "2. If the knowledge base contains relevant information, use it to answer.\n" +
                "3. If the question is outside the HVAC domain, politely redirect the user to HVAC-related topics.\n" +
                "4. Be concise, professional, and helpful.\n" +
                "5. If you don't know the answer, say so honestly and suggest contacting support.\n" +
                "6. Format responses clearly with bullet points or numbered lists when appropriate.\n\n" +
                knowledgeContext;
    }

    private String extractResponseText(String responseBody) {
        try {
            JsonObject response = gson.fromJson(responseBody, JsonObject.class);
            JsonArray candidates = response.getAsJsonArray("candidates");
            if (candidates != null && candidates.size() > 0) {
                JsonObject firstCandidate = candidates.get(0).getAsJsonObject();
                JsonObject content = firstCandidate.getAsJsonObject("content");
                JsonArray parts = content.getAsJsonArray("parts");
                if (parts != null && parts.size() > 0) {
                    return parts.get(0).getAsJsonObject().get("text").getAsString();
                }
            }
            return "I couldn't generate a response. Please try again.";
        } catch (Exception e) {
            logger.error("Error parsing Gemini response: {}", e.getMessage());
            return "I couldn't process the response. Please try again.";
        }
    }

    // ==================== Knowledge Base CRUD ====================

    public KnowledgeBaseResponse createEntry(KnowledgeBaseRequest request) {
        ChatbotKnowledge entry = new ChatbotKnowledge();
        entry.setTitle(request.getTitle());
        entry.setCategory(request.getCategory());
        entry.setContent(request.getContent());
        entry.setActive(request.isActive());
        ChatbotKnowledge saved = knowledgeRepository.save(entry);
        return toResponse(saved);
    }

    public Page<KnowledgeBaseResponse> getAllEntries(Pageable pageable) {
        return knowledgeRepository.findAll(pageable).map(this::toResponse);
    }

    public KnowledgeBaseResponse getEntry(Long id) {
        ChatbotKnowledge entry = knowledgeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Knowledge base entry not found"));
        return toResponse(entry);
    }

    public KnowledgeBaseResponse updateEntry(Long id, KnowledgeBaseRequest request) {
        ChatbotKnowledge entry = knowledgeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Knowledge base entry not found"));
        entry.setTitle(request.getTitle());
        entry.setCategory(request.getCategory());
        entry.setContent(request.getContent());
        entry.setActive(request.isActive());
        ChatbotKnowledge saved = knowledgeRepository.save(entry);
        return toResponse(saved);
    }

    public void deleteEntry(Long id) {
        if (!knowledgeRepository.existsById(id)) {
            throw new RuntimeException("Knowledge base entry not found");
        }
        knowledgeRepository.deleteById(id);
    }

    private KnowledgeBaseResponse toResponse(ChatbotKnowledge entry) {
        return new KnowledgeBaseResponse(
                entry.getId(),
                entry.getTitle(),
                entry.getCategory(),
                entry.getContent(),
                entry.isActive(),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }
}
