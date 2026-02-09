package com.hvac.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class ChatRequest {

    @NotBlank(message = "Message is required")
    private String message;

    private List<ChatMessage> history;

    @Data
    public static class ChatMessage {
        private String role;
        private String content;
    }
}
