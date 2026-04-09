package com.petshop.dto.response;

import java.util.List;

public record HomepageResponse(
        List<FeaturedProductDto> featured
) {}
