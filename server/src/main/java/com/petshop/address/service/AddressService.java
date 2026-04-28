package com.petshop.address.service;

import com.petshop.exception.BusinessException;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.address.dto.request.AddressRequest;
import com.petshop.address.dto.response.AddressResponse;
import com.petshop.address.entity.Address;
import com.petshop.address.repository.AddressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressService {

    private static final int MAX_ADDRESSES = 10;

    private final AddressRepository addressRepository;

    public List<AddressResponse> list(Long userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream()
                .map(AddressResponse::from)
                .toList();
    }

    @Transactional
    public AddressResponse create(Long userId, AddressRequest req) {
        if (addressRepository.countByUserId(userId) >= MAX_ADDRESSES) {
            throw new BusinessException("En fazla " + MAX_ADDRESSES + " adres kaydedebilirsiniz.");
        }

        if (req.isDefault()) {
            addressRepository.clearDefaultByUserId(userId);
        }

        Address address = Address.builder()
                .userId(userId)
                .title(req.title())
                .fullName(req.fullName())
                .phone(req.phone())
                .city(req.city())
                .district(req.district())
                .addressLine(req.addressLine())
                .isDefault(req.isDefault())
                .build();

        return AddressResponse.from(addressRepository.save(address));
    }

    @Transactional
    public AddressResponse update(Long userId, Long addressId, AddressRequest req) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Adres", addressId));

        if (req.isDefault()) {
            addressRepository.clearDefaultByUserId(userId);
        }

        address.setTitle(req.title());
        address.setFullName(req.fullName());
        address.setPhone(req.phone());
        address.setCity(req.city());
        address.setDistrict(req.district());
        address.setAddressLine(req.addressLine());
        address.setDefault(req.isDefault());

        return AddressResponse.from(addressRepository.save(address));
    }

    @Transactional
    public void delete(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Adres", addressId));
        addressRepository.delete(address);
    }

    @Transactional
    public AddressResponse setDefault(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Adres", addressId));

        addressRepository.clearDefaultByUserId(userId);
        address.setDefault(true);

        return AddressResponse.from(addressRepository.save(address));
    }
}
