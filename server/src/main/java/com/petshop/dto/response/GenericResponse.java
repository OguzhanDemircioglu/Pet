package com.petshop.dto.response;

import com.petshop.constant.ResponseMessages;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenericResponse {
    private boolean success;
    private String message;
    private Map<String, String> errors;

    public static GenericResponse ok() {
        return new GenericResponse(true, ResponseMessages.SUCCESS.get(), null);
    }

    public static GenericResponse ok(String message) {
        return new GenericResponse(true, message, null);
    }

    public static GenericResponse error(String message) {
        return new GenericResponse(false, message, null);
    }

    public static GenericResponse error(String message, Map<String, String> errors) {
        return new GenericResponse(false, message, errors);
    }
}
