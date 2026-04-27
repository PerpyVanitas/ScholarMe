package com.scholarme.features.sessions.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SessionManagementScreen(
    onBackClick: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Sessions", fontWeight = FontWeight.Bold) }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(3) { index ->
                SessionCard(
                    title = "Math Tutoring",
                    status = if (index == 0) "UPCOMING" else "COMPLETED",
                    date = "Oct 24, 2026 - 2:00 PM"
                )
            }
        }
    }
}

@Composable
fun SessionCard(title: String, status: String, date: String) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
        shape = MaterialTheme.shapes.medium,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Badge(containerColor = if (status == "UPCOMING") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondary) {
                    Text(status, modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp))
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(date, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (status == "UPCOMING") {
                    OutlinedButton(onClick = {}, modifier = Modifier.weight(1f), shape = MaterialTheme.shapes.small) {
                        Text("Reschedule")
                    }
                    Button(onClick = {}, modifier = Modifier.weight(1f), shape = MaterialTheme.shapes.small) {
                        Text("Join Link")
                    }
                } else {
                    OutlinedButton(onClick = {}, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.small) {
                        Text("Leave Review")
                    }
                }
            }
        }
    }
}
