package com.scholarme.core.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.scholarme.features.admin.ui.AdminDashboardScreen
import com.scholarme.features.admin.ui.UserManagementScreen
import com.scholarme.features.availability.ui.AvailabilityManagerScreen
import com.scholarme.features.notifications.ui.NotificationsScreen
import com.scholarme.features.quizzes.ui.QuizActiveScreen
import com.scholarme.features.quizzes.ui.QuizListScreen
import com.scholarme.features.resources.ui.ResourceDirectoryScreen
import com.scholarme.features.resources.ui.ResourceViewerScreen
import com.scholarme.features.sessions.ui.SessionBookingScreen
import com.scholarme.features.sessions.ui.SessionManagementScreen
import com.scholarme.features.timesheet.ui.TimesheetScreen
import com.scholarme.features.tutors.ui.TutorProfileScreen
import com.scholarme.features.tutors.ui.TutorsScreen
import com.scholarme.features.voting.ui.VotingScreen
import com.scholarme.features.gamification.ui.LeaderboardScreen
import com.scholarme.features.messaging.ui.MessagesListScreen
import com.scholarme.features.messaging.ui.ActiveChatScreen

@Composable
fun AppNavHost(
    navController: NavHostController,
    startDestination: String = Screen.TutorsDirectory.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // Tutors Flow
        composable(Screen.TutorsDirectory.route) {
            TutorsScreen(
                onTutorClick = { tutorId ->
                    navController.navigate(Screen.TutorProfile.createRoute(tutorId))
                }
            )
        }
        
        composable(
            route = Screen.TutorProfile.route,
            arguments = listOf(navArgument("tutorId") { type = NavType.StringType })
        ) { backStackEntry ->
            val tutorId = backStackEntry.arguments?.getString("tutorId") ?: return@composable
            TutorProfileScreen(
                tutorId = tutorId,
                onBackClick = { navController.popBackStack() },
                onBookSessionClick = { tid ->
                    navController.navigate(Screen.SessionBooking.createRoute(tid))
                }
            )
        }

        // Sessions Flow
        composable(
            route = Screen.SessionBooking.route,
            arguments = listOf(navArgument("tutorId") { type = NavType.StringType })
        ) { backStackEntry ->
            val tutorId = backStackEntry.arguments?.getString("tutorId") ?: return@composable
            SessionBookingScreen(
                tutorId = tutorId,
                onBackClick = { navController.popBackStack() },
                onBookingComplete = {
                    navController.navigate(Screen.SessionManagement.route) {
                        popUpTo(Screen.TutorsDirectory.route)
                    }
                }
            )
        }
        
        composable(Screen.SessionManagement.route) {
            SessionManagementScreen(
                onBackClick = { navController.popBackStack() }
            )
        }

        // Resources Flow
        composable(Screen.ResourceDirectory.route) {
            ResourceDirectoryScreen(
                onRepositoryClick = { repoId ->
                    navController.navigate(Screen.ResourceViewer.createRoute(repoId))
                }
            )
        }
        
        composable(
            route = Screen.ResourceViewer.route,
            arguments = listOf(navArgument("repoId") { type = NavType.StringType })
        ) { backStackEntry ->
            val repoId = backStackEntry.arguments?.getString("repoId") ?: return@composable
            ResourceViewerScreen(
                repoName = "Repository #$repoId",
                onBackClick = { navController.popBackStack() }
            )
        }

        // Quizzes Flow
        composable(Screen.QuizList.route) {
            QuizListScreen(
                onStartQuiz = { quizId ->
                    navController.navigate(Screen.QuizActive.createRoute(quizId))
                }
            )
        }
        
        composable(
            route = Screen.QuizActive.route,
            arguments = listOf(navArgument("quizId") { type = NavType.StringType })
        ) { backStackEntry ->
            val quizId = backStackEntry.arguments?.getString("quizId") ?: return@composable
            QuizActiveScreen(
                quizTitle = "Quiz #$quizId",
                onClose = { navController.popBackStack() }
            )
        }

        // Role-Specific & Admin Flow
        composable(Screen.AvailabilityManager.route) {
            AvailabilityManagerScreen()
        }
        
        composable(Screen.Timesheet.route) {
            TimesheetScreen()
        }
        
        composable(Screen.AdminDashboard.route) {
            AdminDashboardScreen(
                onManageUsersClick = { navController.navigate(Screen.UserManagement.route) }
            )
        }
        
        composable(Screen.UserManagement.route) {
            UserManagementScreen(
                onBackClick = { navController.popBackStack() }
            )
        }

        // Engagement Flow
        composable(Screen.Notifications.route) {
            NotificationsScreen()
        }
        
        composable(Screen.Voting.route) {
            VotingScreen()
        }
        
        composable(Screen.Leaderboard.route) {
            LeaderboardScreen()
        }
        
        // Messaging Flow
        composable(Screen.MessagesList.route) {
            MessagesListScreen(
                onNavigateToChat = { conversationId ->
                    navController.navigate(Screen.ActiveChat.createRoute(conversationId))
                }
            )
        }
        
        composable(
            route = Screen.ActiveChat.route,
            arguments = listOf(navArgument("conversationId") { type = NavType.StringType })
        ) { backStackEntry ->
            val conversationId = backStackEntry.arguments?.getString("conversationId") ?: return@composable
            ActiveChatScreen(
                conversationId = conversationId,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
