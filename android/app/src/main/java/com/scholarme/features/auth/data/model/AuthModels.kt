package com.scholarme.features.auth.data.model

import com.google.gson.annotations.SerializedName
import android.os.Parcelable
import kotlinx.parcelize.Parcelize

data class CardLoginRequest(
    @SerializedName("cardId") val cardId: String,
    val pin: String
)

data class EmailLoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    @SerializedName("user") val user: com.scholarme.features.profile.data.model.UserProfile?,
    @SerializedName("token") val token: String,
    @SerializedName("profile") val profile: com.scholarme.features.profile.data.model.UserProfile? = null,
    @SerializedName("userId") val userId: String? = null,
    @SerializedName("email") val email: String? = null
)

data class RegisterRequest(
    val email: String,
    val password: String,
    @SerializedName("fullName") val fullName: String,
    val role: String = "LEARNER"
)

data class RegisterResponse(
    @SerializedName("user") val user: com.scholarme.features.profile.data.model.UserProfile?,
    @SerializedName("token") val token: String?,
    @SerializedName("session") val sessionToken: String? = null
)

@Parcelize
data class AuthCard(
    val id: String,
    val cardId: String,
    val userId: String?,
    val userName: String?,
    val pin: String,
    val status: String,
    val createdAt: String
) : Parcelable
