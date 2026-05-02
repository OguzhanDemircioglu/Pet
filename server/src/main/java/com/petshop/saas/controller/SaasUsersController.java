package com.petshop.saas.controller;

import com.petshop.dto.response.DataGenericResponse;
import com.petshop.dto.response.GenericResponse;
import com.petshop.saas.dto.CompanyUserDto;
import com.petshop.saas.dto.InviteUserRequest;
import com.petshop.saas.service.SaasUsersService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/saas/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SaasUsersController {

    private final SaasUsersService service;

    @GetMapping
    public ResponseEntity<DataGenericResponse<List<CompanyUserDto>>> list() {
        return ResponseEntity.ok(DataGenericResponse.of(service.list()));
    }

    @PostMapping
    public ResponseEntity<DataGenericResponse<CompanyUserDto>> invite(@Valid @RequestBody InviteUserRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(service.invite(req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<GenericResponse> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ResponseEntity.ok(GenericResponse.ok());
    }
}
