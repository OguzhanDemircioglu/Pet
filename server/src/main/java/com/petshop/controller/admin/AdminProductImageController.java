package com.petshop.controller.admin;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.petshop.dto.response.ProductResponse;
import com.petshop.entity.Product;
import com.petshop.entity.ProductImage;
import com.petshop.exception.BusinessException;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.repository.ProductImageRepository;
import com.petshop.repository.ProductRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/products/{productId}/images")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminProductImageController {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final Cloudinary cloudinary;

    @GetMapping
    public ResponseEntity<List<ProductResponse.ImageDto>> listImages(@PathVariable Long productId) {
        productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün", productId));
        return ResponseEntity.ok(toDto(productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId)));
    }

    @PostMapping
    public ResponseEntity<ProductResponse.ImageDto> uploadImage(
            @PathVariable Long productId,
            @RequestParam("file") MultipartFile file) throws IOException {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün", productId));

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BusinessException("Sadece resim dosyası yüklenebilir.");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap("folder", "products")
        );
        String imageUrl = (String) result.get("secure_url");

        int count = productImageRepository.countByProductId(productId);
        ProductImage image = ProductImage.builder()
                .product(product)
                .imageUrl(imageUrl)
                .isPrimary(count == 0)
                .displayOrder(count)
                .build();

        ProductImage saved = productImageRepository.save(image);
        return ResponseEntity.ok(new ProductResponse.ImageDto(
                saved.getId(), saved.getImageUrl(), saved.getIsPrimary(), saved.getDisplayOrder()));
    }

    @PutMapping("/{imageId}/primary")
    @Transactional
    public ResponseEntity<Void> setPrimary(
            @PathVariable Long productId,
            @PathVariable Long imageId) {

        productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün", productId));
        ProductImage image = productImageRepository.findByIdAndProductId(imageId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Resim", imageId));

        productImageRepository.clearPrimaryByProductId(productId);
        image.setIsPrimary(true);
        productImageRepository.save(image);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/reorder")
    @Transactional
    public ResponseEntity<Void> reorder(
            @PathVariable Long productId,
            @RequestBody List<Long> orderedIds) {

        productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün", productId));

        List<ProductImage> images = productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        for (int i = 0; i < orderedIds.size(); i++) {
            final int order = i;
            final Long id = orderedIds.get(i);
            images.stream()
                    .filter(img -> img.getId().equals(id))
                    .findFirst()
                    .ifPresent(img -> img.setDisplayOrder(order));
        }
        productImageRepository.saveAll(images);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{imageId}")
    @Transactional
    public ResponseEntity<Void> deleteImage(
            @PathVariable Long productId,
            @PathVariable Long imageId) throws IOException {

        productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün", productId));
        ProductImage image = productImageRepository.findByIdAndProductId(imageId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Resim", imageId));

        String publicId = extractPublicId(image.getImageUrl());
        if (publicId != null) {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        }

        boolean wasPrimary = Boolean.TRUE.equals(image.getIsPrimary());
        productImageRepository.delete(image);

        if (wasPrimary) {
            List<ProductImage> remaining = productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId);
            if (!remaining.isEmpty()) {
                productImageRepository.clearPrimaryByProductId(productId);
                remaining.get(0).setIsPrimary(true);
                productImageRepository.save(remaining.get(0));
            }
        }
        return ResponseEntity.noContent().build();
    }

    /** Cloudinary URL'den public_id çıkarır.
     *  https://res.cloudinary.com/{cloud}/image/upload/v123/products/abc.jpg → products/abc */
    private String extractPublicId(String url) {
        if (url == null || !url.contains("/upload/")) return null;
        String withoutExt = url.replaceAll("\\.[^./]+$", "");
        int idx = withoutExt.indexOf("/upload/");
        String afterUpload = withoutExt.substring(idx + 8);
        return afterUpload.replaceFirst("^v\\d+/", "");
    }

    private List<ProductResponse.ImageDto> toDto(List<ProductImage> images) {
        return images.stream()
                .map(i -> new ProductResponse.ImageDto(i.getId(), i.getImageUrl(), i.getIsPrimary(), i.getDisplayOrder()))
                .toList();
    }
}
