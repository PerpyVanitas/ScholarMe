package com.scholarme

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.navigation.AppNavHost
import com.scholarme.core.navigation.Screen
import com.scholarme.core.theme.ScholarMeTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    @Inject
    lateinit var tokenManager: TokenManager

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        
        setContent {
            ScholarMeTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination
                val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
                val scope = rememberCoroutineScope()
                
                val isLoggedIn = tokenManager.isLoggedIn()
                val role = tokenManager.getUserRole() ?: "learner"

                // We only show the global TopAppBar on top-level screens
                val topLevelRoutes = listOf(
                    Screen.Dashboard.route,
                    Screen.AdminDashboard.route,
                    Screen.ResourceDirectory.route,
                    Screen.QuizList.route,
                    Screen.FlashcardList.route,
                    Screen.TutorsDirectory.route,
                    Screen.SessionManagement.route,
                    Screen.MessagesList.route,
                    Screen.Voting.route,
                    Screen.Leaderboard.route,
                    Screen.Notifications.route
                )

                val isTopLevel = currentDestination?.route in topLevelRoutes

                ModalNavigationDrawer(
                    drawerState = drawerState,
                    gesturesEnabled = isLoggedIn,
                    drawerContent = {
                        if (isLoggedIn) {
                            ModalDrawerSheet {
                                Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
                                    Spacer(Modifier.height(16.dp))
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                                    ) {
                                        Surface(color = Color.Black, shape = MaterialTheme.shapes.small) {
                                            Icon(Icons.Default.School, contentDescription = null, tint = Color.White, modifier = Modifier.padding(4.dp))
                                        }
                                        Spacer(Modifier.width(12.dp))
                                        Column {
                                            Text("ScholarMe", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                                            Text(role.uppercase(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                                        }
                                    }
                                    Divider(modifier = Modifier.padding(vertical = 8.dp))

                                    // Core
                                    Text("Core", modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    DrawerItem("Dashboard", Icons.Default.Dashboard, Screen.Dashboard.route, currentDestination?.route, navController, drawerState)
                                    DrawerItem("Notifications", Icons.Default.Notifications, Screen.Notifications.route, currentDestination?.route, navController, drawerState)

                                    // Academics
                                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                                    Text("Academics & Study", modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    DrawerItem("Resource Library", Icons.Default.MenuBook, Screen.ResourceDirectory.route, currentDestination?.route, navController, drawerState)
                                    DrawerItem("Study Quizzes", Icons.Default.Lightbulb, Screen.QuizList.route, currentDestination?.route, navController, drawerState)
                                    DrawerItem("Flashcards", Icons.Default.Style, Screen.FlashcardList.route, currentDestination?.route, navController, drawerState)

                                    // Community
                                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                                    Text("Community & Interaction", modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    DrawerItem("Find Tutors", Icons.Default.People, Screen.TutorsDirectory.route, currentDestination?.route, navController, drawerState)
                                    DrawerItem("My Sessions", Icons.Default.CalendarMonth, Screen.SessionManagement.route, currentDestination?.route, navController, drawerState)
                                    DrawerItem("My Messages", Icons.Default.Chat, Screen.MessagesList.route, currentDestination?.route, navController, drawerState)
                                    DrawerItem("Voting", Icons.Default.HowToVote, Screen.Voting.route, currentDestination?.route, navController, drawerState)
                                    DrawerItem("Leaderboard", Icons.Default.Leaderboard, Screen.Leaderboard.route, currentDestination?.route, navController, drawerState)

                                    // Admin / Management
                                    if (role == "administrator") {
                                        Divider(modifier = Modifier.padding(vertical = 8.dp))
                                        Text("Admin Tools", modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        DrawerItem("Admin Dashboard", Icons.Default.AdminPanelSettings, Screen.AdminDashboard.route, currentDestination?.route, navController, drawerState)
                                        DrawerItem("User Management", Icons.Default.ManageAccounts, Screen.UserManagement.route, currentDestination?.route, navController, drawerState)
                                        DrawerItem("Timesheet Audit", Icons.Default.AccessTime, Screen.AdminTimesheets.route, currentDestination?.route, navController, drawerState)
                                        DrawerItem("Platform Analytics", Icons.Default.Analytics, Screen.AdminAnalytics.route, currentDestination?.route, navController, drawerState)
                                        DrawerItem("Card Management", Icons.Default.CreditCard, Screen.AdminCards.route, currentDestination?.route, navController, drawerState)
                                        DrawerItem("QR Scanner", Icons.Default.QrCodeScanner, Screen.AdminScanner.route, currentDestination?.route, navController, drawerState)
                                    } else if (role == "tutor") {
                                        Divider(modifier = Modifier.padding(vertical = 8.dp))
                                        Text("Tutor Tools", modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        DrawerItem("My Timesheet", Icons.Default.AccessTime, Screen.Timesheet.route, currentDestination?.route, navController, drawerState)
                                        DrawerItem("Availability", Icons.Default.EventAvailable, Screen.AvailabilityManager.route, currentDestination?.route, navController, drawerState)
                                    }

                                    Spacer(Modifier.weight(1f))
                                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                                    DrawerItem("Profile Settings", Icons.Default.Person, Screen.Profile.route, currentDestination?.route, navController, drawerState)
                                    Spacer(Modifier.height(16.dp))
                                }
                            }
                        }
                    }
                ) {
                    Scaffold(
                        modifier = Modifier.fillMaxSize(),
                        topBar = {
                            if (isLoggedIn && isTopLevel) {
                                TopAppBar(
                                    title = { Text(getScreenTitle(currentDestination?.route)) },
                                    navigationIcon = {
                                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                            Icon(Icons.Default.Menu, contentDescription = "Menu")
                                        }
                                    }
                                )
                            }
                        }
                    ) { innerPadding ->
                        Surface(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(innerPadding),
                            color = MaterialTheme.colorScheme.background
                        ) {
                            val startDestination = if (isLoggedIn) {
                                if (role == "administrator") Screen.AdminDashboard.route else Screen.Dashboard.route
                            } else {
                                Screen.Login.route
                            }
                            
                            AppNavHost(
                                navController = navController,
                                startDestination = startDestination
                            )
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun DrawerItem(
        label: String,
        icon: androidx.compose.ui.graphics.vector.ImageVector,
        route: String,
        currentRoute: String?,
        navController: androidx.navigation.NavController,
        drawerState: DrawerState
    ) {
        val scope = rememberCoroutineScope()
        NavigationDrawerItem(
            icon = { Icon(icon, contentDescription = null) },
            label = { Text(label) },
            selected = currentRoute == route,
            modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding),
            onClick = {
                scope.launch { drawerState.close() }
                navController.navigate(route) {
                    popUpTo(navController.graph.findStartDestination().id) {
                        saveState = true
                    }
                    launchSingleTop = true
                    restoreState = true
                }
            }
        )
    }

    private fun getScreenTitle(route: String?): String {
        return when (route) {
            Screen.Dashboard.route -> "Dashboard"
            Screen.AdminDashboard.route -> "Admin Dashboard"
            Screen.ResourceDirectory.route -> "Resources"
            Screen.QuizList.route -> "Study Quizzes"
            Screen.FlashcardList.route -> "Flashcards"
            Screen.TutorsDirectory.route -> "Find Tutors"
            Screen.SessionManagement.route -> "My Sessions"
            Screen.MessagesList.route -> "Messages"
            Screen.Voting.route -> "Voting"
            Screen.Leaderboard.route -> "Leaderboard"
            Screen.Notifications.route -> "Notifications"
            else -> "ScholarMe"
        }
    }
}
