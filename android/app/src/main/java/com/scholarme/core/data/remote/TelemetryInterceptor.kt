package com.scholarme.core.data.remote

import android.os.Build
import com.scholarme.BuildConfig
import okhttp3.Interceptor
import okhttp3.Response

/**
 * Interceptor that adds telemetry and device metadata to all outgoing requests.
 * Standard for enterprise-grade API monitoring and security.
 */
class TelemetryInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        val userAgent = "ScholarMe-Android/${BuildConfig.VERSION_NAME} " +
                "(Android ${Build.VERSION.RELEASE}; ${Build.MANUFACTURER} ${Build.MODEL})"
        
        val requestWithTelemetry = originalRequest.newBuilder()
            .header("User-Agent", userAgent)
            .header("X-App-Platform", "android")
            .header("X-App-Version", BuildConfig.VERSION_NAME)
            .build()
            
        return chain.proceed(requestWithTelemetry)
    }
}
