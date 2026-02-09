package com.hvac.controller;

import com.hvac.dto.*;
import com.hvac.service.ChatbotService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    // ==================== Customer Chat Endpoint ====================

    @PostMapping("/customer/chatbot")
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        ChatResponse response = chatbotService.chat(request);
        return ResponseEntity.ok(response);
    }

    // ==================== Admin Knowledge Base CRUD ====================

    @PostMapping("/admin/knowledge-base")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createEntry(@Valid @RequestBody KnowledgeBaseRequest request) {
        try {
            KnowledgeBaseResponse response = chatbotService.createEntry(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/admin/knowledge-base")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<KnowledgeBaseResponse>> getAllEntries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        return ResponseEntity.ok(chatbotService.getAllEntries(pageable));
    }

    @GetMapping("/admin/knowledge-base/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getEntry(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(chatbotService.getEntry(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/admin/knowledge-base/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateEntry(
            @PathVariable Long id,
            @Valid @RequestBody KnowledgeBaseRequest request
    ) {
        try {
            KnowledgeBaseResponse response = chatbotService.updateEntry(id, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/knowledge-base/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteEntry(@PathVariable Long id) {
        try {
            chatbotService.deleteEntry(id);
            return ResponseEntity.ok(Map.of("message", "Knowledge base entry deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
