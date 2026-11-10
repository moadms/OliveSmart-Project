package com.olivesmart.detection.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ParcelAnalysisResponse(
    int totalTrees,
    int healthyCount,
    int stressCount,
    int suspectCount,
    double meanConfidence,
    long inferenceTimeMs,
    double meanCrownDiameterMeters,
    List<DetectedTreeDto> trees,
    int youngCount,
    int adultCount,
    int centenaryCount,
    double totalCanopyAreaM2,
    String droneVideoStatus
) {
    // Constructeur rétro-compatible à 8 arguments
    public ParcelAnalysisResponse(
        int totalTrees,
        int healthyCount,
        int stressCount,
        int suspectCount,
        double meanConfidence,
        long inferenceTimeMs,
        double meanCrownDiameterMeters,
        List<DetectedTreeDto> trees
    ) {
        this(
            totalTrees,
            healthyCount,
            stressCount,
            suspectCount,
            meanConfidence,
            inferenceTimeMs,
            meanCrownDiameterMeters,
            trees,
            (int) (trees != null ? trees.stream().filter(t -> "JEUNE".equalsIgnoreCase(t.ageCategory())).count() : 0),
            (int) (trees != null ? trees.stream().filter(t -> "ADULTE".equalsIgnoreCase(t.ageCategory())).count() : 0),
            (int) (trees != null ? trees.stream().filter(t -> "CENTENAIRE".equalsIgnoreCase(t.ageCategory())).count() : 0),
            trees != null ? Math.round(trees.stream().mapToDouble(DetectedTreeDto::crownAreaM2).sum() * 10.0) / 10.0 : 0.0,
            "TRAITÉ (Kalman Filter + ByteTrack - 30 FPS)"
        );
    }
}
