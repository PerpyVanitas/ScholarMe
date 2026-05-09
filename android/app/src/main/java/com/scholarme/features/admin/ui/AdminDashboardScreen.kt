@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.scholarme.features.admin.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Timeline
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun AdminDashboardScreen(
    onManageUsersClick: () -> Unit,
    onAnalyticsClick: () -> Unit,
    onTimesheetApprovalsClick: () -> Unit,
    onCardManagementClick: () -> Unit,
    onScannerClick: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Admin Dashboard", fontWeight = FontWeight.Bold) }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    AdminStatCard("Total Users", "1,245", Icons.Default.People)
                }
                item {
                    AdminStatCard("Active Sessions", "42", Icons.Default.Timeline)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text("Admin Actions", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)

            // User Management Card
            AdminActionCard(
                title = "Manage Users & Roles",
                description = "Issue cards, change roles, suspend users",
                icon = Icons.Default.Security,
                onClick = onManageUsersClick
            )

            // Analytics Card
            AdminActionCard(
                title = "System Analytics",
                description = "Growth charts, revenue and success rates",
                icon = Icons.Default.Timeline,
                onClick = onAnalyticsClick
            )

            // Timesheet Approvals Card
            AdminActionCard(
                title = "Timesheet Approvals",
                description = "Review and approve tutor timesheets",
                icon = Icons.Default.Payments,
                onClick = onTimesheetApprovalsClick
            )

            // Card Management Card
            AdminActionCard(
                title = "Auth Card Management",
                description = "Issue, revoke, and track physical cards",
                icon = Icons.Default.CreditCard,
                onClick = onCardManagementClick
            )

            // Identity Scanner Card
            AdminActionCard(
                title = "Identity Scanner",
                description = "Scan student QR ID for instant verification",
                icon = Icons.Default.Security,
                onClick = onScannerClick
            )
        }
    }
}

@Composable
fun AdminActionCard(title: String, description: String, icon: ImageVector, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                color = MaterialTheme.colorScheme.primaryContainer,
                shape = MaterialTheme.shapes.medium
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    modifier = Modifier.padding(12.dp).size(24.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text(description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
fun AdminStatCard(label: String, value: String, icon: ImageVector) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp), tint = MaterialTheme.colorScheme.primary)
            Spacer(modifier = Modifier.height(12.dp))
            Text(value, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold)
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
