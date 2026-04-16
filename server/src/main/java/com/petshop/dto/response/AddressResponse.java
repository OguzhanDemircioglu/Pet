package com.petshop.dto.response;

import com.petshop.entity.Address;

public record AddressResponse(
        Long id,
        String title,
        String fullName,
        String phone,
        String city,
        String district,
        String addressLine,
        boolean isDefault
) {
    public static AddressResponse from(Address a) {
        return new AddressResponse(
                a.getId(),
                a.getTitle(),
                a.getFullName(),
                a.getPhone(),
                a.getCity(),
                a.getDistrict(),
                a.getAddressLine(),
                a.isDefault()
        );
    }
}
