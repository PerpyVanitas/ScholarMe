package com.scholarme.features.timesheet.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimesheetScreen() {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Timesheet", fontWeight = FontWeight.Bold) }
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
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(24.dp).fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Total Hours Logged", style = MaterialTheme.typography.titleMedium)
                    Text("42.5", style = MaterialTheme.typography.displayMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Text("This Month", style = MaterialTheme.typography.bodySmall)
                }
            }

            Text("Recent Entries", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(5) {
                    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.padding(16.dp).fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Math Tutoring - John D.", fontWeight = FontWeight.Medium)
                                Text("Oct 24, 2026", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Text("1.5 hrs", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
