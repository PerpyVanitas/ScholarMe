package com.scholarme.core.navigation

/**
 * Defines all routes for the Jetpack Compose Navigation Graph.
 */
sealed class Screen(val route: String) {
    // Phase 1: Core Loop
    object Dashboard : Screen("dashboard")
    object TutorsDirectory : Screen("tutors")
    object TutorProfile : Screen("tutor_profile/{tutorId}") {
        fun createRoute(tutorId: String) = "tutor_profile/$tutorId"
    }
    object SessionBooking : Screen("session_booking/{tutorId}") {
        fun createRoute(tutorId: String) = "session_booking/$tutorId"
    }
    object SessionManagement : Screen("sessions")

    // Phase 2: Educational Content
    object ResourceDirectory : Screen("resources")
    object ResourceViewer : Screen("resource_viewer/{repoId}") {
        fun createRoute(repoId: String) = "resource_viewer/$repoId"
    }
    object QuizList : Screen("quizzes")
    object QuizActive : Screen("quiz_active/{quizId}") {
        fun createRoute(quizId: String) = "quiz_active/$quizId"
    }

    // Phase 3: Role-Specific
    object AvailabilityManager : Screen("availability")
    object Timesheet : Screen("timesheet")
    object AdminDashboard : Screen("admin")
    object UserManagement : Screen("user_management")

    // Phase 4: Engagement
    object Notifications : Screen("notifications")
    object Voting : Screen("voting")
    object Leaderboard : Screen("leaderboard")
    object MessagesList : Screen("messages")
    object ActiveChat : Screen("chat/{conversationId}") {
        fun createRoute(conversationId: String) = "chat/$conversationId"
    }
}
