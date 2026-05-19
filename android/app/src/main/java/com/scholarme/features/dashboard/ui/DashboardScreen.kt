package com.scholarme.features.dashboard.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.scholarme.features.dashboard.domain.model.Session
import com.scholarme.features.dashboard.domain.model.DashboardStats
import com.scholarme.core.util.Result

@Composable
fun DashboardScreen(
    userName: String,
    userRole: String,
    statsResult: Result<DashboardStats>,
    sessionsResult: Result<List<Session>>,
    onStudyClick: () -> Unit = {},
    onQuizClick: () -> Unit = {},
    onProfileClick: () -> Unit = {},
    onManageUsersClick: () -> Unit = {},
    onAnalyticsClick: () -> Unit = {},
    onScannerClick: () -> Unit = {},
    onSessionClick: (Session) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(vertical = 24.dp)
    ) {
        // Welcome Header
        item {
            Column {
                Text(
                    "Welcome back,",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    userName,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Text(
                        userRole.replaceFirstChar { it.uppercaseChar() },
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Stats Section
        item {
            when (statsResult) {
                is Result.Success -> {
                    StatsGrid(role = userRole, stats = statsResult.data)
                }
                is Result.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.padding(16.dp))
                }
                else -> { /* Silent error for stats */ }
            }
        }

        // Quick Actions Row
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (userRole == "administrator") {
                    QuickActionCard(
                        title = "Users",
                        icon = Icons.Default.Group,
                        containerColor = MaterialTheme.colorScheme.primaryContainer,
                        modifier = Modifier.weight(1f),
                        onClick = onManageUsersClick
                    )
                    QuickActionCard(
                        title = "Analytics",
                        icon = Icons.Default.Analytics,
                        containerColor = MaterialTheme.colorScheme.secondaryContainer,
                        modifier = Modifier.weight(1f),
                        onClick = onAnalyticsClick
                    )
                    QuickActionCard(
                        title = "Scanner",
                        icon = Icons.Default.QrCodeScanner,
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer,
                        modifier = Modifier.weight(1f),
                        onClick = onScannerClick
                    )
                } else {
                    QuickActionCard(
                        title = "Study",
                        icon = Icons.Default.School,
                        containerColor = MaterialTheme.colorScheme.primaryContainer,
                        modifier = Modifier.weight(1f),
                        onClick = onStudyClick
                    )
                    QuickActionCard(
                        title = "Quizzes",
                        icon = Icons.Default.Quiz,
                        containerColor = MaterialTheme.colorScheme.secondaryContainer,
                        modifier = Modifier.weight(1f),
                        onClick = onQuizClick
                    )
                    QuickActionCard(
                        title = "Profile",
                        icon = Icons.Default.Person,
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer,
                        modifier = Modifier.weight(1f),
                        onClick = onProfileClick
                    )
                }
            }
        }

        // Section Title: Upcoming Sessions
        item {
            Text(
                if (userRole == "administrator") "Recent Sessions" else "Upcoming Sessions",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        // Sessions List
        when (sessionsResult) {
            is Result.Success -> {
                val sessions = sessionsResult.data
                if (sessions.isEmpty()) {
                    item {
                        EmptyState("No sessions found")
                    }
                } else {
                    items(sessions) { session ->
                        SessionItem(session = session, onClick = { onSessionClick(session) })
                    }
                }
            }
            is Result.Loading -> {
                item {
                    Box(Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            }
            is Result.Error -> {
                item {
                    EmptyState(sessionsResult.message)
                }
            }
        }
    }
}

@Composable
fun StatsGrid(role: String, stats: DashboardStats) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        when (role) {
            "administrator" -> {
                StatCard("Users", stats.totalUsers.toString(), Icons.Default.People, Modifier.weight(1f))
                StatCard("Sessions", stats.totalSessions.toString(), Icons.Default.Event, Modifier.weight(1f))
            }
            "tutor" -> {
                StatCard("Rating", stats.rating.toString(), Icons.Default.Star, Modifier.weight(1f))
                StatCard("Completed", stats.completedSessions.toString(), Icons.Default.CheckCircle, Modifier.weight(1f))
            }
            else -> {
                StatCard("Sessions", stats.totalBookedSessions.toString(), Icons.Default.Event, Modifier.weight(1f))
                StatCard("XP", stats.totalXp.toString(), Icons.Default.TrendingUp, Modifier.weight(1f))
            }
        }
    }
}

@Composable
fun StatCard(label: String, value: String, icon: ImageVector, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp), tint = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.width(8.dp))
            Column {
                Text(value, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
fun EmptyState(message: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(message, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun QuickActionCard(
    title: String,
    icon: ImageVector,
    containerColor: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .height(100.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(28.dp))
            Spacer(Modifier.height(8.dp))
            Text(title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }
    }
}

@Composable
fun SessionItem(session: Session, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(session.tutorAvatarUrl ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=${session.tutorName ?: session.id}")
                    .crossfade(true)
                    .build(),
                contentDescription = null,
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentScale = ContentScale.Crop
            )

            Spacer(Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    session.tutorName ?: "Tutoring Session",
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    session.specializationName ?: session.topic ?: "Study Session",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Icon(
                        Icons.Default.Schedule,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        "${session.scheduledAt} • ${session.startTime}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Status Badge
            Surface(
                color = when (session.status.lowercase()) {
                    "confirmed" -> Color(0xFFE8F5E9)
                    "pending" -> Color(0xFFFFF3E0)
                    "cancelled" -> Color(0xFFFFEBEE)
                    else -> MaterialTheme.colorScheme.surfaceVariant
                },
                contentColor = when (session.status.lowercase()) {
                    "confirmed" -> Color(0xFF2E7D32)
                    "pending" -> Color(0xFFEF6C00)
                    "cancelled" -> Color(0xFFC62828)
                    else -> MaterialTheme.colorScheme.onSurfaceVariant
                },
                shape = RoundedCornerShape(100.dp)
            ) {
                Text(
                    session.status.replaceFirstChar { it.uppercaseChar() },
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
