package com.hvac.repository;

import com.hvac.entity.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {

    Optional<VerificationCode> findByEmailAndCodeAndIsUsedFalse(String email, String code);

    @Modifying
    @Transactional
    @Query("DELETE FROM VerificationCode v WHERE v.expiresAt < :now")
    void deleteExpiredCodes(LocalDateTime now);

    @Modifying
    @Transactional
    void deleteByEmail(String email);
}
