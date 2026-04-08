package com.petshop.controller;

import com.petshop.dto.response.BrandResponse;
import com.petshop.repository.BrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/brands")
@RequiredArgsConstructor
public class BrandController {

    private final BrandRepository brandRepository;

    @GetMapping
    public List<BrandResponse> listActive() {
        return brandRepository.findByIsActiveTrueOrderByNameAsc()
                .stream().map(BrandResponse::from).toList();
    }
}
