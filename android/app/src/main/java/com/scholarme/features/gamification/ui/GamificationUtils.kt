package com.scholarme.features.gamification.ui

import androidx.compose.ui.graphics.Color

object GamificationUtils {
    fun getLevelTitle(level: Int): String {
        return when {
            level >= 100 -> "Legendary Scholar"
            level >= 50 -> "Grandmaster"
            level >= 25 -> "Master"
            level >= 15 -> "Expert"
            level >= 10 -> "Advanced Scholar"
            level >= 5 -> "Scholar"
            else -> "Novice"
        }
    }

    fun getLevelColor(level: Int): Color {
        return when {
            level >= 100 -> Color(0xFFE2E8F0) // Diamond/Platinum
            level >= 50 -> Color(0xFFFFD700) // Gold
            level >= 25 -> Color(0xFFC0C0C0) // Silver
            level >= 10 -> Color(0xFFCD7F32) // Bronze
            level >= 5 -> Color(0xFF3B82F6) // Blue
            else -> Color(0xFF94A3B8) // Slate (Novice)
        }
    }
}
