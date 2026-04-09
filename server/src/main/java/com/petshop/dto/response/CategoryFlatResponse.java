package com.petshop.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CategoryFlatResponse(
        @JsonProperty("category_id")    Long categoryId,
        @JsonProperty("category_name")  String categoryName,
        @JsonProperty("emoji")          String emoji,
        @JsonProperty("category_slug")  String categorySlug,
        @JsonProperty("parent_id")      Long parentId,
        @JsonProperty("parent_slug")    String parentSlug,
        @JsonProperty("display_order")  int displayOrder,
        @JsonProperty("has_product")    boolean hasProduct
) {}
