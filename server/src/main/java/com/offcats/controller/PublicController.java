package com.offcats.controller;

import com.offcats.dto.response.AdminInfoResponse;
import com.offcats.entity.User;
import com.offcats.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicController {

    private final UserRepository userRepository;

    @GetMapping("/admin-info")
    public ResponseEntity<AdminInfoResponse> adminInfo() {
        return userRepository.findFirstByRole(User.Role.ADMIN)
                .map(admin -> ResponseEntity.ok(new AdminInfoResponse(admin.getEmail(), admin.getPhone())))
                .orElse(ResponseEntity.notFound().build());
    }
}
