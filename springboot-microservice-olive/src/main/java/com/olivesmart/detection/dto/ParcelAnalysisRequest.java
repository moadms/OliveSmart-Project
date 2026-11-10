package com.olivesmart.detection.dto;

import java.util.List;

public record ParcelAnalysisRequest(
    String imageBase64,
    List<GpsPoint> vertices,
    Double gsdMetersPerPixel,
    String modelType // "YOLOv8m_CA", "YOLOv8m_CBAM", etc.
) {
    public ParcelAnalysisRequest {
        if (gsdMetersPerPixel == null || gsdMetersPerPixel <= 0) {
            gsdMetersPerPixel = 0.05; // 5.0 cm/px correspondant au zoom 17 Google Satellite
        }
    }
}
