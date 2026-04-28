package com.petshop.notification.controller;

import com.petshop.dto.response.DataGenericResponse;
import com.petshop.dto.response.GenericResponse;
import com.petshop.notification.dto.response.NotificationResponse;
import com.petshop.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/myNotifications")
    public ResponseEntity<DataGenericResponse<List<NotificationResponse>>> getMyNotifications(
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(DataGenericResponse.of(notificationService.getUserNotifications(userId)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<GenericResponse> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        notificationService.markRead(id, userId);
        return ResponseEntity.ok(GenericResponse.ok());
    }

    @PatchMapping("/read-all")
    public ResponseEntity<GenericResponse> markAllRead(
            @AuthenticationPrincipal Long userId) {
        notificationService.markAllRead(userId);
        return ResponseEntity.ok(GenericResponse.ok());
    }
}
