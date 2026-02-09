package com.hvac.repository;

import com.hvac.entity.ChatbotKnowledge;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatbotKnowledgeRepository extends JpaRepository<ChatbotKnowledge, Long> {

    List<ChatbotKnowledge> findByIsActiveTrue();

    Page<ChatbotKnowledge> findByIsActiveTrue(Pageable pageable);

    List<ChatbotKnowledge> findByCategoryAndIsActiveTrue(String category);
}
