package com.hvac.repository;

import com.hvac.entity.KnowledgeBase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeBase, Long> {
    List<KnowledgeBase> findByIsActiveTrue();
    Page<KnowledgeBase> findAllByOrderByUpdatedAtDesc(Pageable pageable);
    List<KnowledgeBase> findByCategoryAndIsActiveTrue(String category);
}
