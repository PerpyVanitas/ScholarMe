package com.scholarme.features.gamification.data.model

import com.google.gson.annotations.SerializedName
import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class LeaderboardEntry(
    val rank: Int,
    val id: String,
    val fullName: String,
    val avatarUrl: String?,
    @SerializedName("totalXp") val totalXp: Int,
    @SerializedName("currentLevel") val currentLevel: Int,
    val profileThemeColor: String?,
    val isCurrentUser: Boolean
) : Parcelable

@Parcelize
data class LeaderboardResponse(
    val leaderboard: List<LeaderboardEntry>,
    val currentUserId: String
) : Parcelable

@Parcelize
data class XpAwardResponse(
    val newXp: Int,
    val newLevel: Int,
    val leveledUp: Boolean,
    val xpEarned: Int
) : Parcelable
