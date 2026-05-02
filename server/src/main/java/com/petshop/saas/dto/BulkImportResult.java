package com.petshop.saas.dto;

import java.util.List;

public record BulkImportResult(
        int totalRows,
        int createdCount,
        int skippedCount,
        List<RowError> errors
) {
    public record RowError(int row, String reason) {}
}
