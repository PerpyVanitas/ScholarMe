package com.scholarme.core.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.scholarme.features.admin.ui.*
import com.scholarme.features.dashboard.ui.*
import com.scholarme.features.profile.ui.*
import com.scholarme.features.availability.ui.AvailabilityManagerScreen


import com.scholarme.features.notifications.ui.NotificationsScreen
import com.scholarme.features.quizzes.ui.*
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
        // Dashboard
        composable(Screen.Dashboard.route) {
            val viewModel: DashboardViewModel = hiltViewModel()
            val userName by viewModel.userName.collectAsState()
            val sessionsState by viewModel.sessions.collectAsState()
            
            DashboardScreen(
                userName = userName,
                sessions = (sessionsState as? Result.Success)?.data ?: emptyList(),
                onStudyClick = { navController.navigate(Screen.ResourceDirectory.route) },
                onQuizClick = { navController.navigate(Screen.QuizList.route) },
                onProfileClick = { navController.navigate(Screen.Profile.route) },
                onSessionClick = { /* Handle session detail */ }
            )
        }

        composable(Screen.Profile.route) {
            val viewModel: ProfileViewModel = hiltViewModel()
            val profileState by viewModel.profileState.collectAsState()
            
            ProfileScreen(
                profileState = (profileState as? Result.Success)?.let { Result.Success(it.data) } ?: Result.Loading,
                onBackClick = { navController.popBackStack() },
                onEditClick = { /* Handle edit */ },
                onLogoutClick = {
                    viewModel.logout()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0)
                    }
                }
            )
        }

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
                },
                onStudyQuiz = { quizId ->
                    navController.navigate(Screen.QuizStudy.createRoute(quizId))
                }
            )
        }
        
        composable(
            route = Screen.QuizStudy.route,
            arguments = listOf(navArgument("quizId") { type = NavType.StringType })
        ) { backStackEntry ->
            val quizId = backStackEntry.arguments?.getString("quizId") ?: return@composable
            val viewModel: QuizViewModel = hiltViewModel()
            val studySet by viewModel.currentStudySet.collectAsState()
            
            LaunchedEffect(quizId) {
                viewModel.fetchStudySet(quizId)
            }
            
            QuizStudyScreen(
                title = studySet?.title ?: "Study Mode",
                items = studySet?.items ?: emptyList(),
                onClose = { navController.popBackStack() }
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
                onManageUsersClick = { navController.navigate(Screen.UserManagement.route) },
                onAnalyticsClick = { navController.navigate(Screen.AdminAnalytics.route) },
                onTimesheetApprovalsClick = { navController.navigate(Screen.AdminTimesheets.route) },
                onCardManagementClick = { navController.navigate(Screen.AdminCards.route) },
                onScannerClick = { navController.navigate(Screen.AdminScanner.route) }
            )
        }
        
        composable(Screen.AdminAnalytics.route) {
            val viewModel: AdminViewModel = hiltViewModel()
            val analytics by viewModel.analytics.collectAsState()
            
            LaunchedEffect(Unit) {
                viewModel.fetchAnalytics()
            }
            
            AnalyticsScreen(
                analytics = analytics,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.AdminTimesheets.route) {
            val viewModel: AdminViewModel = hiltViewModel()
            val timesheets by viewModel.timesheets.collectAsState()
            
            LaunchedEffect(Unit) {
                viewModel.fetchTimesheets()
            }
            
            AdminTimesheetScreen(
                timesheets = timesheets,
                onApprove = { viewModel.approveTimesheet(it) },
                onReject = { viewModel.rejectTimesheet(it) },
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.AdminCards.route) {
            val viewModel: AdminViewModel = hiltViewModel()
            val cards by viewModel.cards.collectAsState()
            
            LaunchedEffect(Unit) {
                viewModel.fetchCards()
            }
            
            CardManagementScreen(
                cards = cards,
                onIssueCard = { uid, cid, pin -> viewModel.issueCard(uid, cid, pin) },
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.AdminScanner.route) {
            AdminScannerScreen(
                onScanResult = { result ->
                    // Expected format: scholarme_id:USER_ID:USER_NAME
                    val parts = result.split(":")
                    if (parts.size >= 3 && parts[0] == "scholarme_id") {
                        navController.navigate(Screen.UserAudit.createRoute(parts[1], parts[2])) {
                            popUpTo(Screen.AdminScanner.route) { inclusive = true }
                        }
                    }
                },
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.UserManagement.route) {

            UserManagementScreen(
                onBackClick = { navController.popBackStack() },
                onViewLogsClick = { userId, userName ->
                    navController.navigate(Screen.UserAudit.createRoute(userId, userName))
                }
            )
        }

        composable(
            route = Screen.UserAudit.route,
            arguments = listOf(
                navArgument("userId") { type = NavType.StringType },
                navArgument("userName") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val userId = backStackEntry.arguments?.getString("userId") ?: return@composable
            val userName = backStackEntry.arguments?.getString("userName") ?: "User"
            val viewModel: AdminViewModel = hiltViewModel()
            val logs by viewModel.auditLogs.collectAsState()
            
            LaunchedEffect(userId) {
                viewModel.fetchAuditLogs(userId)
            }
            
            UserAuditScreen(
                userName = userName,
                logs = logs,
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
                },
                onBackClick = { navController.popBackStack() }
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
