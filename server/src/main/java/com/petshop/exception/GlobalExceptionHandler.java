package com.petshop.exception;

import com.petshop.constant.AuthMessages;
import com.petshop.constant.ExceptionMessages;
import com.petshop.dto.response.GenericResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<GenericResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach((FieldError fe) -> errors.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
        String firstMessage = errors.values().stream().findFirst()
                .orElse(ExceptionMessages.VALIDATION_ERROR.get());
        return ResponseEntity.ok(GenericResponse.error(firstMessage, errors));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<GenericResponse> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getConstraintViolations()
                .forEach(cv -> errors.putIfAbsent(cv.getPropertyPath().toString(), cv.getMessage()));
        String firstMessage = errors.values().stream().findFirst()
                .orElse(ExceptionMessages.VALIDATION_ERROR.get());
        return ResponseEntity.ok(GenericResponse.error(firstMessage, errors));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<GenericResponse> handleBusiness(BusinessException ex) {
        log.warn("Business rule violated: {}", ex.getMessage());
        return ResponseEntity.ok(GenericResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<GenericResponse> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(GenericResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<GenericResponse> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(GenericResponse.error(AuthMessages.INVALID_CREDENTIALS.get()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<GenericResponse> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(GenericResponse.error(ExceptionMessages.ACCESS_DENIED.get()));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<GenericResponse> handleNoResource(NoResourceFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(GenericResponse.error(ExceptionMessages.PAGE_NOT_FOUND.get()));
    }

    @ExceptionHandler(AsyncRequestNotUsableException.class)
    public void handleBrokenPipe(AsyncRequestNotUsableException ex) {
        log.debug("Client disconnected before response completed");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<GenericResponse> handleGeneral(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(GenericResponse.error(ExceptionMessages.UNEXPECTED_ERROR.get()));
    }
}
