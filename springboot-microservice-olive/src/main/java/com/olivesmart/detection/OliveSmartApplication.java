package com.olivesmart.detection;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OliveSmartApplication {

    public static void main(String[] args) {
        SpringApplication.run(OliveSmartApplication.class, args);
        System.out.println("==================================================================");
        System.out.println("🌱 Microservice OliveSmart démarré avec succès sur le port 8080 !");
        System.out.println("📡 API Endpoint Cadastre: POST http://localhost:8080/api/v1/parcelles/analyser");
        System.out.println("==================================================================");
    }
}
