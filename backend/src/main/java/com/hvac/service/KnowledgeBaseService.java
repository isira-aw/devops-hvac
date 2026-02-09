package com.hvac.service;

import com.hvac.dto.KnowledgeBaseRequest;
import com.hvac.dto.KnowledgeBaseResponse;
import com.hvac.entity.KnowledgeBase;
import com.hvac.repository.KnowledgeBaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class KnowledgeBaseService {

    private final KnowledgeBaseRepository knowledgeBaseRepository;

    public KnowledgeBaseService(KnowledgeBaseRepository knowledgeBaseRepository) {
        this.knowledgeBaseRepository = knowledgeBaseRepository;
    }

    public KnowledgeBaseResponse create(KnowledgeBaseRequest request) {
        KnowledgeBase kb = new KnowledgeBase();
        kb.setTitle(request.getTitle());
        kb.setContent(request.getContent());
        kb.setCategory(request.getCategory());
        kb.setActive(request.isActive());
        return KnowledgeBaseResponse.fromEntity(knowledgeBaseRepository.save(kb));
    }

    public KnowledgeBaseResponse update(Long id, KnowledgeBaseRequest request) {
        KnowledgeBase kb = knowledgeBaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Knowledge base entry not found"));
        kb.setTitle(request.getTitle());
        kb.setContent(request.getContent());
        kb.setCategory(request.getCategory());
        kb.setActive(request.isActive());
        return KnowledgeBaseResponse.fromEntity(knowledgeBaseRepository.save(kb));
    }

    public void delete(Long id) {
        if (!knowledgeBaseRepository.existsById(id)) {
            throw new RuntimeException("Knowledge base entry not found");
        }
        knowledgeBaseRepository.deleteById(id);
    }

    public KnowledgeBaseResponse getById(Long id) {
        KnowledgeBase kb = knowledgeBaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Knowledge base entry not found"));
        return KnowledgeBaseResponse.fromEntity(kb);
    }

    public Page<KnowledgeBaseResponse> getAll(Pageable pageable) {
        return knowledgeBaseRepository.findAllByOrderByUpdatedAtDesc(pageable)
                .map(KnowledgeBaseResponse::fromEntity);
    }

    public String getKnowledgeContext() {
        List<KnowledgeBase> entries = knowledgeBaseRepository.findByIsActiveTrue();
        if (entries.isEmpty()) {
            return "";
        }
        return entries.stream()
                .map(kb -> String.format("[%s - %s]\n%s", kb.getCategory(), kb.getTitle(), kb.getContent()))
                .collect(Collectors.joining("\n\n"));
    }
}
