package com.petshop.controller.admin;

import com.petshop.dto.request.CampaignRequest;
import com.petshop.dto.response.CampaignResponse;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.dto.response.GenericResponse;
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
    public ResponseEntity<DataGenericResponse<List<CampaignResponse>>> list() {
        return ResponseEntity.ok(DataGenericResponse.of(campaignService.getAllCampaigns()));
    }

    @PostMapping
    public ResponseEntity<DataGenericResponse<CampaignResponse>> create(@Valid @RequestBody CampaignRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(campaignService.createCampaign(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DataGenericResponse<CampaignResponse>> update(@PathVariable Long id, @Valid @RequestBody CampaignRequest req) {
        return ResponseEntity.ok(DataGenericResponse.of(campaignService.updateCampaign(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<GenericResponse> delete(@PathVariable Long id) {
        campaignService.deleteCampaign(id);
        return ResponseEntity.ok(GenericResponse.ok());
    }

    @GetMapping("/active-emojis")
    public ResponseEntity<DataGenericResponse<Set<String>>> activeEmojis() {
        return ResponseEntity.ok(DataGenericResponse.of(campaignService.getActiveEmojis()));
    }
}
