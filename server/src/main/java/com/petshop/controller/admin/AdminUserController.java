package com.petshop.controller.admin;

import com.petshop.dto.response.DataGenericResponse;
import com.petshop.entity.User;
import com.petshop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;

    record AdminUserView(
            Long id,
            String firstName,
            String lastName,
            String email,
            String phone,
            String role,
            LocalDateTime createdAt
    ) {}

    @GetMapping
    public ResponseEntity<DataGenericResponse<Page<AdminUserView>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<AdminUserView> result = userRepository.findAll(pageable)
                .map(u -> new AdminUserView(
                        u.getId(),
                        u.getFirstName(),
                        u.getLastName(),
                        u.getEmail(),
                        u.getPhone(),
                        u.getRole() != null ? u.getRole().name() : null,
                        u.getCreatedAt()
                ));
        return ResponseEntity.ok(DataGenericResponse.of(result));
    }
}
