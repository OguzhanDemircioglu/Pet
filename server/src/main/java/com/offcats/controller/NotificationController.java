package com.offcats.controller;

import com.offcats.dto.response.NotificationResponse;
import com.offcats.service.NotificationService;
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

    @GetMapping("/my")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal Long userId) {
        List<NotificationResponse> notifications = notificationService.getUserNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(
            @AuthenticationPrincipal Long userId) {
        notificationService.markAllRead(userId);
        return ResponseEntity.noContent().build();
    }
}
