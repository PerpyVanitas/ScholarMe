package com.scholarme

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
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
import javax.inject.Inject

import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    @Inject
    lateinit var tokenManager: TokenManager

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
                
                // Top-level destinations for Bottom Nav
                val bottomNavItems = listOf(
                    BottomNavItem("Dashboard", Screen.Dashboard.route, Icons.Default.Home),
                    BottomNavItem("Quizzes", Screen.QuizList.route, Icons.Default.Quiz),
                    BottomNavItem("Flashcards", Screen.FlashcardList.route, Icons.Default.Style),
                    BottomNavItem("Profile", Screen.Profile.route, Icons.Default.Person)
                )

                // Screens where we SHOULD show the bottom nav
                val showBottomNav = currentDestination?.route in bottomNavItems.map { it.route }

                ModalNavigationDrawer(
                    drawerState = drawerState,
                    drawerContent = {
                        ModalDrawerSheet {
                            Spacer(Modifier.height(16.dp))
                            Text(
                                "ScholarMe Menu",
                                modifier = Modifier.padding(16.dp),
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Divider()
                            NavigationDrawerItem(
                                label = { Text("Admin Dashboard") },
                                selected = currentDestination?.route == Screen.AdminDashboard.route,
                                onClick = {
                                    scope.launch { drawerState.close() }
                                    navController.navigate(Screen.AdminDashboard.route)
                                }
                            )
                            NavigationDrawerItem(
                                label = { Text("Gamification Leaderboard") },
                                selected = currentDestination?.route == Screen.Leaderboard.route,
                                onClick = {
                                    scope.launch { drawerState.close() }
                                    navController.navigate(Screen.Leaderboard.route)
                                }
                            )
                            NavigationDrawerItem(
                                label = { Text("Active Polls") },
                                selected = currentDestination?.route == Screen.Voting.route,
                                onClick = {
                                    scope.launch { drawerState.close() }
                                    navController.navigate(Screen.Voting.route)
                                }
                            )
                            NavigationDrawerItem(
                                label = { Text("Timesheets") },
                                selected = currentDestination?.route == Screen.Timesheet.route,
                                onClick = {
                                    scope.launch { drawerState.close() }
                                    navController.navigate(Screen.Timesheet.route)
                                }
                            )
                        }
                    }
                ) {
                    Scaffold(
                        modifier = Modifier.fillMaxSize(),
                        bottomBar = {
                            if (showBottomNav) {
                                NavigationBar {
                                    bottomNavItems.forEach { item ->
                                        val selected = currentDestination?.hierarchy?.any { it.route == item.route } == true
                                        NavigationBarItem(
                                            icon = { Icon(item.icon, contentDescription = item.label) },
                                            label = { Text(item.label) },
                                            selected = selected,
                                            onClick = {
                                                navController.navigate(item.route) {
                                                    popUpTo(navController.graph.findStartDestination().id) {
                                                        saveState = true
                                                    }
                                                    launchSingleTop = true
                                                    restoreState = true
                                                }
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    ) { innerPadding ->
                        Surface(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(innerPadding),
                            color = MaterialTheme.colorScheme.background
                        ) {
                            val startDestination = if (tokenManager.isLoggedIn()) {
                                Screen.Dashboard.route
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
}

data class BottomNavItem(
    val label: String,
    val route: String,
    val icon: ImageVector
)
