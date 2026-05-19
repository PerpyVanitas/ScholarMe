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
    object QuizStudy : Screen("quiz_study/{quizId}") {
        fun createRoute(quizId: String) = "quiz_study/$quizId"
    }


    // Phase 3: Role-Specific
    object AvailabilityManager : Screen("availability")
    object Timesheet : Screen("timesheet")
    object AdminDashboard : Screen("admin")
    object UserManagement : Screen("user_management")
    object AdminAnalytics : Screen("admin_analytics")
    object AdminTimesheets : Screen("admin_timesheets")
    object AdminCards : Screen("admin_cards")
    object AdminScanner : Screen("admin_scanner")
    object UserAudit : Screen("user_audit/{userId}/{userName}") {


        fun createRoute(userId: String, userName: String) = "user_audit/$userId/$userName"
    }




    // Phase 4: Engagement
    object Notifications : Screen("notifications")
    object Voting : Screen("voting")
    object Leaderboard : Screen("leaderboard")
    object MessagesList : Screen("messages")
    object ActiveChat : Screen("chat/{conversationId}") {
        fun createRoute(conversationId: String) = "chat/$conversationId"
    }

    // Phase 5: Authentication & Profile
    object Login : Screen("login")
    object Register : Screen("register")
    object Profile : Screen("profile")
    object UpdateProfile : Screen("update_profile")
    object ChangePassword : Screen("change_password")
}

