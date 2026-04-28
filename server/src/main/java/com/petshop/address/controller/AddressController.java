package com.petshop.address.controller;

import com.petshop.dto.response.DataGenericResponse;
import com.petshop.dto.response.GenericResponse;
import com.petshop.address.dto.request.AddressRequest;
import com.petshop.address.dto.response.AddressResponse;
import com.petshop.address.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<DataGenericResponse<List<AddressResponse>>> list(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(DataGenericResponse.of(addressService.list(userId)));
    }

    @PostMapping
    public ResponseEntity<DataGenericResponse<AddressResponse>> create(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody AddressRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(addressService.create(userId, req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DataGenericResponse<AddressResponse>> update(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody AddressRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(addressService.update(userId, id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<GenericResponse> delete(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        addressService.delete(userId, id);
        return ResponseEntity.ok(GenericResponse.ok());
    }

    @PatchMapping("/{id}/default")
    public ResponseEntity<DataGenericResponse<AddressResponse>> setDefault(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(DataGenericResponse.of(addressService.setDefault(userId, id)));
    }
}
