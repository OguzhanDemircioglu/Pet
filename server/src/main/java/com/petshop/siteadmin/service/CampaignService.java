package com.petshop.siteadmin.service;

import com.petshop.exception.ResourceNotFoundException;
import com.petshop.siteadmin.dto.request.CampaignRequest;
import com.petshop.siteadmin.dto.response.CampaignResponse;
import com.petshop.siteadmin.entity.Campaign;
import com.petshop.siteadmin.repository.CampaignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CampaignService {

    private final CampaignRepository campaignRepository;

    public List<CampaignResponse> getAllCampaigns() {
        return campaignRepository.findAll(Sort.by("createdAt").descending())
                .stream().map(CampaignResponse::from).toList();
    }

    public List<CampaignResponse> getActiveCampaigns() {
        return campaignRepository.findActiveCampaigns(LocalDateTime.now())
                .stream().map(CampaignResponse::from).toList();
    }

    @Transactional
    public CampaignResponse createCampaign(CampaignRequest req) {
        Campaign c = Campaign.builder()
                .title(req.title())
                .badge(req.badge())
                .description(req.description())
                .emoji(req.emoji())
                .sticker(req.sticker())
                .bgColor(req.bgColor())
                .startDate(req.startDate())
                .endDate(req.endDate())
                .isActive(req.isActive() != null ? req.isActive() : true)
                .build();
        return CampaignResponse.from(campaignRepository.save(c));
    }

    @Transactional
    public CampaignResponse updateCampaign(Long id, CampaignRequest req) {
        Campaign c = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kampanya", id));
        c.setTitle(req.title());
        c.setBadge(req.badge());
        c.setDescription(req.description());
        c.setEmoji(req.emoji());
        c.setSticker(req.sticker());
        c.setBgColor(req.bgColor());
        c.setStartDate(req.startDate());
        c.setEndDate(req.endDate());
        if (req.isActive() != null) c.setIsActive(req.isActive());
        return CampaignResponse.from(campaignRepository.save(c));
    }

    @Transactional
    public void deleteCampaign(Long id) {
        if (!campaignRepository.existsById(id)) throw new ResourceNotFoundException("Kampanya", id);
        campaignRepository.deleteById(id);
    }

    public Set<String> getActiveEmojis() {
        return new HashSet<>(campaignRepository.findActiveEmojis());
    }
}
