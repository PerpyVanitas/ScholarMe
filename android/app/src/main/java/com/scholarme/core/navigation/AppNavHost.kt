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
import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.navigation.navArgument
import com.scholarme.core.util.Result
import com.scholarme.features.dashboard.domain.model.Session
import com.scholarme.features.admin.ui.*
import com.scholarme.features.dashboard.ui.*
import com.scholarme.features.profile.ui.*
import com.scholarme.features.auth.ui.login.*
import com.scholarme.features.auth.ui.register.*
import com.scholarme.features.availability.ui.AvailabilityManagerScreen
import com.scholarme.features.notifications.ui.NotificationsScreen
import com.scholarme.features.notifications.ui.NotificationViewModel
import com.scholarme.features.quizzes.ui.*
import com.scholarme.features.resources.ui.ResourceDirectoryScreen
import com.scholarme.features.resources.ui.ResourceViewerScreen
import com.scholarme.features.sessions.ui.SessionBookingScreen
import com.scholarme.features.sessions.ui.SessionManagementScreen
import com.scholarme.features.timesheet.ui.TimesheetScreen
import com.scholarme.features.tutors.ui.TutorProfileScreen
import com.scholarme.features.tutors.ui.TutorsScreen
import com.scholarme.features.tutors.ui.TutorViewModel
import com.scholarme.features.voting.ui.VotingScreen
import com.scholarme.features.voting.ui.VotingViewModel
import com.scholarme.features.gamification.ui.LeaderboardScreen
import com.scholarme.features.gamification.ui.LeaderboardViewModel
import com.scholarme.features.messaging.ui.MessagesListScreen
import com.scholarme.features.messaging.ui.ActiveChatScreen
import com.scholarme.features.messaging.ui.MessagingViewModel
import com.scholarme.features.gamification.data.model.LeaderboardEntry

@Composable
fun AppNavHost(
    navController: NavHostController,
    startDestination: String = Screen.Dashboard.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
        enterTransition = {
            slideInHorizontally(initialOffsetX = { 1000 }, animationSpec = tween(400)) + fadeIn(animationSpec = tween(400))
        },
        exitTransition = {
            slideOutHorizontally(targetOffsetX = { -1000 }, animationSpec = tween(400)) + fadeOut(animationSpec = tween(400))
        },
        popEnterTransition = {
            slideInHorizontally(initialOffsetX = { -1000 }, animationSpec = tween(400)) + fadeIn(animationSpec = tween(400))
        },
        popExitTransition = {
            slideOutHorizontally(targetOffsetX = { 1000 }, animationSpec = tween(400)) + fadeOut(animationSpec = tween(400))
        }
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
                onSessionClick = { navController.navigate(Screen.SessionManagement.route) }
            )
        }

        composable(Screen.Profile.route) {
            val viewModel: ProfileViewModel = hiltViewModel()
            val profileState by viewModel.profileState.collectAsState()
            
            ProfileScreen(
                profileState = profileState,
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
            val viewModel: TutorViewModel = hiltViewModel()
            val state by viewModel.uiState.collectAsState()
            TutorsScreen(
                state = state,
                onSearchQueryChanged = { viewModel.onSearchQueryChanged(it) },
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
                analytics = (analytics as? Result.Success)?.data,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.AdminTimesheets.route) {
            val viewModel: AdminViewModel = hiltViewModel()
            val timesheetsState by viewModel.timesheets.collectAsState()
            
            LaunchedEffect(Unit) {
                viewModel.fetchTimesheets()
            }
            
            AdminTimesheetScreen(
                timesheets = (timesheetsState as? Result.Success)?.data ?: emptyList(),
                isLoading = timesheetsState is Result.Loading,
                onApprove = { viewModel.approveTimesheet(it) },
                onReject = { viewModel.rejectTimesheet(it) },
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.AdminCards.route) {
            val viewModel: AdminViewModel = hiltViewModel()
            val cardsState by viewModel.cards.collectAsState()
            
            LaunchedEffect(Unit) {
                viewModel.fetchCards()
            }
            
            CardManagementScreen(
                cards = (cardsState as? Result.Success)?.data ?: emptyList(),
                onIssueCard = { uid, cid, pin -> viewModel.issueCard(uid, cid, pin) },
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.AdminScanner.route) {
            AdminScannerScreen(
                onScanResult = { result ->
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
            val logsState by viewModel.auditLogs.collectAsState()
            
            LaunchedEffect(userId) {
                viewModel.fetchAuditLogs(userId)
            }
            
            UserAuditScreen(
                userName = userName,
                logs = (logsState as? Result.Success)?.data ?: emptyList(),
                onBackClick = { navController.popBackStack() }
            )
        }

        // Engagement Flow
        composable(Screen.Notifications.route) {
            val viewModel: NotificationViewModel = hiltViewModel()
            val state by viewModel.uiState.collectAsState()
            NotificationsScreen(
                state = state,
                onBackClick = { navController.popBackStack() }
            )
        }
        
        composable(Screen.Voting.route) {
            val viewModel: VotingViewModel = hiltViewModel()
            val state by viewModel.uiState.collectAsState()
            VotingScreen(
                state = state,
                onBackClick = { navController.popBackStack() }
            )
        }
        
        composable(Screen.Leaderboard.route) {
            val viewModel: LeaderboardViewModel = hiltViewModel()
            val state by viewModel.uiState.collectAsState()
            LeaderboardScreen(
                leaderboard = (state as? Result.Success)?.data ?: emptyList(),
                currentUserId = "", // Can be retrieved from TokenManager if needed
                onBackClick = { navController.popBackStack() }
            )
        }
        
        // Messaging Flow
        composable(Screen.MessagesList.route) {
            val viewModel: MessagingViewModel = hiltViewModel()
            val state by viewModel.uiState.collectAsState()
            MessagesListScreen(
                state = state,
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
            val viewModel: MessagingViewModel = hiltViewModel()
            val state by viewModel.chatState.collectAsState()
            
            LaunchedEffect(conversationId) {
                viewModel.loadMessages(conversationId)
            }
            
            ActiveChatScreen(
                conversationId = conversationId,
                state = state,
                onSendMessage = { viewModel.sendMessage(conversationId, it) },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // Auth Flow
        composable(Screen.Login.route) {
            val viewModel: LoginViewModel = hiltViewModel()
            LoginScreen(
                viewModel = viewModel,
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onRegisterClick = { navController.navigate(Screen.Register.route) }
            )
        }

        composable(Screen.Register.route) {
            val viewModel: RegisterViewModel = hiltViewModel()
            RegisterScreen(
                viewModel = viewModel,
                onRegisterSuccess = {
                    navController.popBackStack()
                },
                onBackToLogin = { navController.popBackStack() }
            )
        }
    }
}
