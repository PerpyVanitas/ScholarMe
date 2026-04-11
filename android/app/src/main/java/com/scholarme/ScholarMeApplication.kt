package com.scholarme

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * Application class for ScholarMe.
 * Annotated with @HiltAndroidApp to enable Hilt dependency injection.
 */
@HiltAndroidApp
class ScholarMeApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        // Initialize any application-wide dependencies here
    }
}
