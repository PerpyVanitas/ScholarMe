plugins {
    id("com.android.application")
    kotlin("android")
    id("com.google.dagger.hilt.android")
    id("com.google.devtools.ksp")
}

android {
    namespace = "com.scholarme"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.scholarme"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        
        // Default values (overridden by flavors)
        buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:8080/api/v1/\"")
        buildConfigField("String", "ENVIRONMENT", "\"development\"")
        buildConfigField("Boolean", "ENABLE_NETWORK_LOGGING", "true")
    }

    flavorDimensions += "environment"
    
    productFlavors {
        create("dev") {
            dimension = "environment"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:8080/api/v1/\"")
            buildConfigField("String", "ENVIRONMENT", "\"development\"")
            buildConfigField("Boolean", "ENABLE_NETWORK_LOGGING", "true")
        }
        create("staging") {
            dimension = "environment"
            applicationIdSuffix = ".staging"
            versionNameSuffix = "-staging"
            buildConfigField("String", "API_BASE_URL", "\"https://staging-api.scholarme.app/api/v1/\"")
            buildConfigField("String", "ENVIRONMENT", "\"staging\"")
            buildConfigField("Boolean", "ENABLE_NETWORK_LOGGING", "false")
        }
        create("production") {
            dimension = "environment"
            buildConfigField("String", "API_BASE_URL", "\"https://api.scholarme.app/api/v1/\"")
            buildConfigField("String", "ENVIRONMENT", "\"production\"")
            buildConfigField("Boolean", "ENABLE_NETWORK_LOGGING", "false")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
        compose = true
    }
    
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.3"
    }
}

dependencies {
    // AndroidX Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.activity:activity-ktx:1.8.2")
    implementation("androidx.fragment:fragment-ktx:1.6.2")
    
    // Lifecycle & ViewModel (includes StateFlow support)
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    
    // Kotlin Flow (for StateFlow)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    
    // Material Design
    implementation("com.google.android.material:material:1.11.0")
    
    // SwipeRefreshLayout
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")
    
    // CoordinatorLayout for scroll behaviors
    implementation("androidx.coordinatorlayout:coordinatorlayout:1.2.0")
    
    // Coil for image loading
    implementation("io.coil-kt:coil:2.5.0")
    
    // Retrofit for HTTP
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    
    // OkHttp Interceptor
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    
    // Gson
    implementation("com.google.code.gson:gson:2.10.1")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    
    // AndroidX Security for encrypted SharedPreferences
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    
    // Splash Screen
    implementation("androidx.core:core-splashscreen:1.0.1")
    
    // Hilt Dependency Injection
    implementation("com.google.dagger:hilt-android:2.48")
    ksp("com.google.dagger:hilt-android-compiler:2.48")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")
    
    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    
    // Jetpack Compose
    val composeBom = platform("androidx.compose:compose-bom:2023.10.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
