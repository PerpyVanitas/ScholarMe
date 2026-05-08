package com.scholarme.core.data.model

import com.google.gson.annotations.SerializedName

// ── Generic response wrapper ──────────────────────────────────────────────────

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ApiError? = null,
    val message: String? = null
)

data class ApiError(
    val code: String,
    val message: String,
    val details: Any? = null
)

// ── Auth ──────────────────────────────────────────────────────────────────────

data class AndroidLoginRequest(
    val email: String,
    val password: String
)

data class AndroidRegisterRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String,
    val phoneNumber: String? = null,
    val accountType: String = "learner"
)

data class AndroidUserInfo(
    val id: String,
    val email: String,
    @SerializedName("fullName") val fullName: String,
    val role: String,
    @SerializedName("avatarUrl") val avatarUrl: String? = null,
    @SerializedName("phoneNumber") val phoneNumber: String? = null,
    val birthdate: String? = null
)

data class AndroidLoginResponse(
    val token: String,
    @SerializedName("refreshToken") val refreshToken: String? = null,
    val user: AndroidUserInfo
)

data class AndroidRegisterResponse(
    val userId: String,
    val email: String,
    val token: String? = null,
    @SerializedName("refreshToken") val refreshToken: String? = null,
    val user: AndroidUserInfo? = null
)

data class AndroidProfileResponse(
    val userId: String,
    val firstName: String,
    val lastName: String,
    val fullName: String,
    val email: String,
    val phoneNumber: String? = null,
    val birthdate: String? = null,
    @SerializedName("avatarUrl") val avatarUrl: String? = null,
    val role: String,
    @SerializedName("profileCompleted") val profileCompleted: Boolean = false,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("tutorStats") val tutorStats: AndroidTutorStats? = null
)

data class AndroidTutorStats(
    val rating: Double = 0.0,
    @SerializedName("totalRatings") val totalRatings: Int = 0,
    @SerializedName("yearsExperience") val yearsExperience: Int? = null,
    @SerializedName("hourlyRate") val hourlyRate: Double? = null
)

data class AndroidUpdateProfileRequest(
    val firstName: String,
    val lastName: String,
    val phoneNumber: String? = null,
    val birthdate: String? = null,
    val bio: String? = null
)

data class ChangePasswordRequest(
    val oldPassword: String,
    val newPassword: String
)

// ── Dashboard ─────────────────────────────────────────────────────────────────

data class AndroidDashboardStats(
    val role: String = "learner",
    // Learner fields
    @SerializedName("totalSessions") val totalSessions: Int = 0,
    @SerializedName("completedSessions") val completedSessions: Int = 0,
    @SerializedName("upcomingSessions") val upcomingSessions: Int = 0,
    // Tutor fields
    val rating: Double = 0.0,
    @SerializedName("totalRatings") val totalRatings: Int = 0,
    // Admin fields
    @SerializedName("totalUsers") val totalUsers: Int = 0,
    @SerializedName("activeTutors") val activeTutors: Int = 0,
    @SerializedName("pendingSessions") val pendingSessions: Int = 0,
    // Common
    @SerializedName("totalStudySets") val totalStudySets: Int = 0,
    @SerializedName("averageQuizScore") val averageQuizScore: Double = 0.0
)

// ── Sessions ──────────────────────────────────────────────────────────────────

data class AndroidSessionDto(
    val id: String,
    @SerializedName("tutorId") val tutorId: String,
    @SerializedName("tutorName") val tutorName: String? = null,
    @SerializedName("tutorAvatarUrl") val tutorAvatarUrl: String? = null,
    @SerializedName("learnerId") val learnerId: String,
    @SerializedName("scheduledDate") val scheduledDate: String,
    @SerializedName("startTime") val startTime: String? = null,
    @SerializedName("endTime") val endTime: String? = null,
    val status: String,
    val notes: String? = null,
    @SerializedName("specializationName") val specializationName: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

typealias Session = AndroidSessionDto

data class AndroidSessionsResponse(
    val sessions: List<AndroidSessionDto>,
    val pagination: AndroidPagination
)

data class AndroidCreateSessionRequest(
    @SerializedName("tutorId") val tutorId: String,
    @SerializedName("scheduledDate") val scheduledDate: String,
    @SerializedName("startTime") val startTime: String,
    @SerializedName("endTime") val endTime: String,
    @SerializedName("specializationId") val specializationId: String? = null,
    val notes: String? = null
)

data class AndroidUpdateStatusRequest(
    val status: String,
    @SerializedName("cancellationReason") val cancellationReason: String? = null
)

// ── Tutors ────────────────────────────────────────────────────────────────────

data class AndroidSpecializationDto(
    val id: String,
    val name: String,
    val description: String? = null,
    val category: String? = null
)

data class AndroidTutorDto(
    val id: String,
    @SerializedName("userId") val userId: String,
    @SerializedName("fullName") val fullName: String,
    val email: String,
    @SerializedName("avatarUrl") val avatarUrl: String? = null,
    val bio: String? = null,
    val rating: Double = 0.0,
    @SerializedName("totalRatings") val totalRatings: Int = 0,
    @SerializedName("hourlyRate") val hourlyRate: Double? = null,
    @SerializedName("experienceYears") val experienceYears: Int? = null,
    @SerializedName("isAvailable") val isAvailable: Boolean = true,
    val specializations: List<AndroidSpecializationDto> = emptyList()
)

data class AndroidTutorsResponse(
    val tutors: List<AndroidTutorDto>,
    val pagination: AndroidPagination
)

data class AndroidSpecializationsResponse(
    val specializations: List<AndroidSpecializationDto>
)

data class AndroidPagination(
    val page: Int,
    val limit: Int,
    val total: Long,
    val pages: Int
)

// ── Messaging ─────────────────────────────────────────────────────────────────

data class AndroidConversationDto(
    val id: String,
    val title: String,
    @SerializedName("lastMessage") val lastMessage: String? = null,
    @SerializedName("lastMessageAt") val lastMessageAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String,
    @SerializedName("unreadCount") val unreadCount: Int = 0,
    @SerializedName("avatarUrl") val avatarUrl: String? = null
)

data class AndroidConversationsResponse(
    val conversations: List<AndroidConversationDto>
)

data class AndroidMessageDto(
    val id: String,
    val content: String,
    @SerializedName("senderId") val senderId: String,
    @SerializedName("senderName") val senderName: String,
    @SerializedName("senderAvatar") val senderAvatar: String? = null,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("isEdited") val isEdited: Boolean = false,
    @SerializedName("isOwn") val isOwn: Boolean = false
)

data class AndroidMessagesResponse(
    @SerializedName("conversationId") val conversationId: String,
    val messages: List<AndroidMessageDto>
)

data class AndroidSendMessageRequest(val content: String)

data class AndroidSendMessageResponse(val id: String, val content: String, @SerializedName("createdAt") val createdAt: String)

data class AndroidCreateConversationRequest(
    @SerializedName("participantIds") val participantIds: List<String>,
    val title: String? = null,
    @SerializedName("firstMessage") val firstMessage: String? = null
)

// ── Polls ─────────────────────────────────────────────────────────────────────

data class AndroidPollOptionDto(
    val id: String,
    val text: String,
    @SerializedName("voteCount") val voteCount: Int = 0
)

data class AndroidPollDto(
    val id: String,
    val title: String,
    val description: String? = null,
    val status: String,
    @SerializedName("endDate") val endDate: String,
    @SerializedName("allowMultipleVotes") val allowMultipleVotes: Boolean = false,
    @SerializedName("isAnonymous") val isAnonymous: Boolean = false,
    @SerializedName("userVotedOptionIds") val userVotedOptionIds: List<String> = emptyList(),
    @SerializedName("hasVoted") val hasVoted: Boolean = false,
    val options: List<AndroidPollOptionDto> = emptyList()
)

data class AndroidPollsResponse(
    val polls: List<AndroidPollDto>
)

data class AndroidVoteRequest(
    @SerializedName("optionId") val optionId: String
)

// ── Gamification ──────────────────────────────────────────────────────────────

data class AndroidLeaderboardEntry(
    val rank: Int,
    val id: String,
    @SerializedName("fullName") val fullName: String,
    @SerializedName("avatarUrl") val avatarUrl: String? = null,
    @SerializedName("totalXp") val totalXp: Int = 0,
    @SerializedName("currentLevel") val currentLevel: Int = 1,
    @SerializedName("profileThemeColor") val profileThemeColor: String? = null,
    @SerializedName("isCurrentUser") val isCurrentUser: Boolean = false
)

data class AndroidLeaderboardResponse(
    val leaderboard: List<AndroidLeaderboardEntry>,
    @SerializedName("currentUserId") val currentUserId: String
)

// ── Quizzes ───────────────────────────────────────────────────────────────────

data class AndroidStudySetDto(
    val id: String,
    val title: String,
    val description: String? = null,
    val type: String,
    @SerializedName("isPublic") val isPublic: Boolean = false,
    @SerializedName("questionCount") val questionCount: Int = 0,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("ownerName") val ownerName: String? = null,
    @SerializedName("ownerAvatarUrl") val ownerAvatarUrl: String? = null
)

data class AndroidStudySetsResponse(
    val studySets: List<AndroidStudySetDto>
)

data class AndroidQuizQuestionDto(
    val id: String,
    @SerializedName("questionText") val questionText: String,
    val answer: String,
    @SerializedName("itemType") val itemType: String,
    val options: List<String> = emptyList(),
    @SerializedName("correctAnswerIndex") val correctAnswerIndex: Int = 0,
    @SerializedName("displayOrder") val displayOrder: Int = 0
)

data class AndroidQuizQuestionsResponse(
    @SerializedName("studySetId") val studySetId: String,
    val title: String,
    val type: String,
    val questions: List<AndroidQuizQuestionDto>
)

// ── Legacy aliases for existing code compatibility ────────────────────────────

@Deprecated("Use AndroidDashboardStats", ReplaceWith("AndroidDashboardStats"))
data class DashboardStats(
    @SerializedName("totalSessions") val totalSessions: Int = 0,
    @SerializedName("upcomingSessions") val upcomingSessions: Int = 0,
    @SerializedName("completedSessions") val completedSessions: Int = 0,
    @SerializedName("totalStudySets") val totalStudySets: Int = 0,
    @SerializedName("averageQuizScore") val averageQuizScore: Double = 0.0
)
