# Java Backend - Hibernate Dependency Fix

## Quick Fix for Your Current Project

Your Android Studio project is missing Hibernate dependencies. Follow these steps:

### Option 1: Fix Maven (If using pom.xml)

Add these dependencies to your `pom.xml`:

```xml
<dependencies>
    <!-- Spring Boot Starter Data JPA (includes Hibernate) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
        <version>3.1.5</version>
    </dependency>

    <!-- Hibernate Core -->
    <dependency>
        <groupId>org.hibernate.orm</groupId>
        <artifactId>hibernate-core</artifactId>
        <version>6.3.0.Final</version>
    </dependency>

    <!-- MySQL Driver -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>8.0.33</version>
    </dependency>

    <!-- Spring Boot Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <version>3.1.5</version>
    </dependency>

    <!-- Lombok (optional - for @Data, @Getter, @Setter) -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>1.18.30</version>
        <scope>provided</scope>
    </dependency>

    <!-- Validation API -->
    <dependency>
        <groupId>jakarta.validation</groupId>
        <artifactId>jakarta.validation-api</artifactId>
        <version>3.0.2</version>
    </dependency>

    <!-- Hibernate Validator -->
    <dependency>
        <groupId>org.hibernate.validator</groupId>
        <artifactId>hibernate-validator</artifactId>
        <version>8.0.1.Final</version>
    </dependency>
</dependencies>
```

### Option 2: Fix Gradle (If using build.gradle)

Add these dependencies to your `build.gradle`:

```gradle
dependencies {
    // Spring Boot Starter Data JPA
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa:3.1.5'

    // Hibernate Core
    implementation 'org.hibernate.orm:hibernate-core:6.3.0.Final'

    // MySQL Driver
    implementation 'com.mysql:mysql-connector-java:8.0.33'

    // Spring Boot Web
    implementation 'org.springframework.boot:spring-boot-starter-web:3.1.5'

    // Lombok
    compileOnly 'org.projectlombok:lombok:1.18.30'
    annotationProcessor 'org.projectlombok:lombok:1.18.30'

    // Validation
    implementation 'jakarta.validation:jakarta.validation-api:3.0.2'
    implementation 'org.hibernate.validator:hibernate-validator:8.0.1.Final'
}
```

### After Adding Dependencies:

1. **Maven**: Right-click project → Maven → Reload Projects
2. **Gradle**: Sync Now button appears in Android Studio
3. **Wait** for IDE to download dependencies (check status bar)
4. **Clean** the project: Build → Clean Project
5. **Rebuild**: Build → Rebuild Project

## Complete Tutor Entity (Fixed)

```java
package com.scholarme.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "tutors")
public class Tutor {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank(message = "User ID cannot be blank")
    @Column(nullable = false, unique = true)
    private String userId;

    @NotBlank(message = "Bio cannot be blank")
    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "years_experience")
    private Integer yearsExperience;

    @Column(name = "hourly_rate")
    private Double hourlyRate;

    @Column(columnDefinition = "TEXT")
    private String languages;

    @Column(name = "rating", columnDefinition = "NUMERIC(3,2) DEFAULT 0")
    private Double rating = 0.0;

    @Column(name = "total_ratings", columnDefinition = "INT DEFAULT 0")
    private Integer totalRatings = 0;

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

## Key Changes from Old to New:

| Old | New | Reason |
|-----|-----|--------|
| `org.hibernate.annotations` | `org.hibernate` | New Hibernate 6.x package structure |
| `javax.persistence` | `jakarta.persistence` | Jakarta EE replaced javax |
| `@Column` | `@Column` | Same, but with better defaults |
| Manual timestamps | `@CreationTimestamp/@UpdateTimestamp` | Automatic timestamp management |

## Verify Fix:

1. Open `Tutor.java`
2. Check if red squiggly lines disappear
3. Ctrl+Shift+O to auto-import with new packages
4. If still errors: File → Invalidate Caches → Restart IDE

## Android Backend Configuration

In your `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/scholarme
spring.datasource.username=root
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
server.port=8080
```

This should resolve all Hibernate import errors!
