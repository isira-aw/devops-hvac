package com.hvac.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VerifyCodeRequest {
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Code is required")
    @Size(min = 3, max = 3, message = "Code must be 3 digits")
    private String code;
}
