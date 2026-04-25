package com.scholarme.core.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val PrimaryLight = Color(0xFF0F172A)
val PrimaryDark = Color(0xFFF8FAFC)
val BackgroundLight = Color(0xFFF8FAFC)
val BackgroundDark = Color(0xFF0F172A)
val SurfaceLight = Color(0xFFFFFFFF)
val SurfaceDark = Color(0xFF1E293B)
val TextLight = Color(0xFF0F172A)
val TextDark = Color(0xFFF8FAFC)
val MutedLight = Color(0xFF64748B)
val MutedDark = Color(0xFF94A3B8)
val BorderLight = Color(0xFFE2E8F0)
val BorderDark = Color(0xFF334155)

private val LightColorScheme = lightColorScheme(
    primary = PrimaryLight,
    onPrimary = SurfaceLight,
    background = BackgroundLight,
    onBackground = TextLight,
    surface = SurfaceLight,
    onSurface = TextLight,
    surfaceVariant = BorderLight,
    onSurfaceVariant = MutedLight,
    outline = BorderLight
)

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryDark,
    onPrimary = SurfaceDark,
    background = BackgroundDark,
    onBackground = TextDark,
    surface = SurfaceDark,
    onSurface = TextDark,
    surfaceVariant = BorderDark,
    onSurfaceVariant = MutedDark,
    outline = BorderDark
)

@Composable
fun ScholarMeTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        // Typography and shapes can be customized here to match web Shadcn
        content = content
    )
}
