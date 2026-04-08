package com.petshop.controller.admin;

import com.petshop.dto.request.CampaignRequest;
import com.petshop.dto.response.CampaignResponse;
import com.petshop.service.CampaignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/admin/campaigns")
@RequiredArgsConstructor
public class AdminCampaignController {

    private final CampaignService campaignService;

    @GetMapping
    public ResponseEntity<List<CampaignResponse>> list() {
        return ResponseEntity.ok(campaignService.getAllCampaigns());
    }

    @PostMapping
    public ResponseEntity<CampaignResponse> create(@Valid @RequestBody CampaignRequest req) {
        return ResponseEntity.ok(campaignService.createCampaign(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CampaignResponse> update(@PathVariable Long id, @Valid @RequestBody CampaignRequest req) {
        return ResponseEntity.ok(campaignService.updateCampaign(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        campaignService.deleteCampaign(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/active-emojis")
    public ResponseEntity<Set<String>> activeEmojis() {
        return ResponseEntity.ok(campaignService.getActiveEmojis());
    }
}
