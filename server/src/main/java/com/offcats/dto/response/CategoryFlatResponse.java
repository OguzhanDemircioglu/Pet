package com.offcats.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CategoryFlatResponse(
        @JsonProperty("category_id")   Long categoryId,
        @JsonProperty("category_name") String categoryName,
        @JsonProperty("category_slug") String categorySlug,
        @JsonProperty("parent_id")     Long parentId,
        @JsonProperty("has_product")   boolean hasProduct
) {}
