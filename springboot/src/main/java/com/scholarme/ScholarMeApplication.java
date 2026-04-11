package com.scholarme;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * ScholarMe API - Main Application Entry Point
 * 
 * Spring Boot 3.x backend for the ScholarMe academic management system.
 * Provides RESTful APIs for authentication, tutor scheduling, resource management,
 * and administrative functions.
 */
@SpringBootApplication
@EnableJpaAuditing
public class ScholarMeApplication {

    public static void main(String[] args) {
        SpringApplication.run(ScholarMeApplication.class, args);
    }
}
