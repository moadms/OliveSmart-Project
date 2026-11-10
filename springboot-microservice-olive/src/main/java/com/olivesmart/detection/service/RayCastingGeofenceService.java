package com.olivesmart.detection.service;

import com.olivesmart.detection.dto.GpsPoint;
import org.springframework.stereotype.Service;
import java.util.List;

/**
 * Service de filtrage spatial cadastral (Point-in-Polygon par algorithme de Ray-Casting)
 * Garantit qu'aucun arbre de la parcelle voisine n'est comptabilisé.
 */
@Service
public class RayCastingGeofenceService {

    public boolean isPointInsidePolygon(double lat, double lng, List<GpsPoint> polygon) {
        if (polygon == null || polygon.size() < 3) {
            return true; // Si pas de polygone défini, pas de filtrage
        }

        boolean inside = false;
        int n = polygon.size();

        for (int i = 0, j = n - 1; i < n; j = i++) {
            double xi = polygon.get(i).lng();
            double yi = polygon.get(i).lat();
            double xj = polygon.get(j).lng();
            double yj = polygon.get(j).lat();

            boolean intersect = ((yi > lat) != (yj > lat))
                    && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);

            if (intersect) {
                inside = !inside;
            }
        }

        return inside;
    }
}
