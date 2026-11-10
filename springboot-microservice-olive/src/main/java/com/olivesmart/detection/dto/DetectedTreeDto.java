package com.olivesmart.detection.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record DetectedTreeDto(
    long id,
    @JsonProperty("healthStatus") @JsonAlias({"health", "healthStatus"}) String healthStatus,
    double confidence,
    @JsonProperty("crownDiameterMeters") @JsonAlias({"diam", "crownDiameterMeters"}) double crownDiameterMeters,
    double lat,
    double lng,
    int estimatedAgeYears,
    String ageCategory,
    double crownAreaM2,
    double pathologyRiskPercentage,
    @JsonProperty("lat_min") @JsonAlias({"lat_min", "latMin"}) Double latMin,
    @JsonProperty("lat_max") @JsonAlias({"lat_max", "latMax"}) Double latMax,
    @JsonProperty("lng_min") @JsonAlias({"lng_min", "lngMin"}) Double lngMin,
    @JsonProperty("lng_max") @JsonAlias({"lng_max", "lngMax"}) Double lngMax,
    @JsonProperty("widthMeters") @JsonAlias({"widthMeters", "width_m"}) Double widthMeters,
    @JsonProperty("heightMeters") @JsonAlias({"heightMeters", "height_m"}) Double heightMeters
) {
    // Constructeur rétro-compatible à 10 arguments
    public DetectedTreeDto(long id, String healthStatus, double confidence, double crownDiameterMeters, double lat, double lng, int estimatedAgeYears, String ageCategory, double crownAreaM2, double pathologyRiskPercentage) {
        this(id, healthStatus, confidence, crownDiameterMeters, lat, lng, estimatedAgeYears, ageCategory, crownAreaM2, pathologyRiskPercentage, null, null, null, null, null, null);
    }

    // Constructeur rétro-compatible à 6 arguments
    public DetectedTreeDto(long id, String healthStatus, double confidence, double crownDiameterMeters, double lat, double lng) {
        this(
            id,
            healthStatus,
            confidence,
            crownDiameterMeters,
            lat,
            lng,
            calculateAge(crownDiameterMeters),
            calculateAgeCategory(crownDiameterMeters),
            Math.round(Math.PI * Math.pow(crownDiameterMeters / 2.0, 2) * 10.0) / 10.0,
            calculatePathologyRisk(healthStatus, confidence),
            null, null, null, null, null, null
        );
    }

    private static int calculateAge(double diam) {
        if (diam < 2.5) return Math.max(2, (int) Math.round(diam * 1.8));
        if (diam < 5.0) return (int) Math.round(5 + (diam - 2.5) * 4.0);
        return (int) Math.round(15 + Math.pow(diam - 5.0, 1.4) * 10.0);
    }

    private static String calculateAgeCategory(double diam) {
        if (diam < 3.2) return "JEUNE";
        if (diam < 6.8) return "ADULTE";
        return "CENTENAIRE";
    }

    private static double calculatePathologyRisk(String health, double conf) {
        if ("SUSPECT".equalsIgnoreCase(health)) return Math.round((85.0 + conf * 12.0) * 10.0) / 10.0;
        if ("STRESS".equalsIgnoreCase(health)) return Math.round((25.0 + (1.0 - conf) * 20.0) * 10.0) / 10.0;
        return Math.round((2.0 + (1.0 - conf) * 5.0) * 10.0) / 10.0;
    }
}
