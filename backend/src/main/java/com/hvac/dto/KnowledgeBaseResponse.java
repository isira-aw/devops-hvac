package com.hvac.dto;

import com.hvac.entity.KnowledgeBase;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class KnowledgeBaseResponse {
    private Long id;
    private String title;
    private String content;
    private String category;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static KnowledgeBaseResponse fromEntity(KnowledgeBase kb) {
        KnowledgeBaseResponse response = new KnowledgeBaseResponse();
        response.setId(kb.getId());
        response.setTitle(kb.getTitle());
        response.setContent(kb.getContent());
        response.setCategory(kb.getCategory());
        response.setActive(kb.isActive());
        response.setCreatedAt(kb.getCreatedAt());
        response.setUpdatedAt(kb.getUpdatedAt());
        return response;
    }
}
