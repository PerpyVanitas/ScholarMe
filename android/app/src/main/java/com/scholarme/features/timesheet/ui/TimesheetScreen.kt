package com.scholarme.features.timesheet.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import java.text.SimpleDateFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimesheetScreen(
    viewModel: TimesheetViewModel = hiltViewModel(),
    onBackClick: () -> Unit
) {
    val activeEntry by viewModel.activeEntry.collectAsState()
    val history by viewModel.history.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    val totalHours = remember(history) {
        history.sumOf { it.totalHours ?: 0.0 }
    }
    val formattedTotalHours = remember(totalHours) {
        String.format(Locale.getDefault(), "%.1f", totalHours)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Timesheet", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
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
                    Text(formattedTotalHours, style = MaterialTheme.typography.displayMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Text("All-Time Completed", style = MaterialTheme.typography.bodySmall)
                }
            }

            Button(
                onClick = { viewModel.toggleClockStatus() },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (activeEntry == null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                ),
                enabled = !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary, modifier = Modifier.size(24.dp))
                } else {
                    Text(if (activeEntry == null) "Clock In" else "Clock Out")
                }
            }

            if (activeEntry != null) {
                val dateFormat = remember { SimpleDateFormat("hh:mm a", Locale.getDefault()) }
                Text(
                    text = "Currently Clocked In since ${dateFormat.format(activeEntry!!.clockInTime)}",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            }

            Text("Recent Entries", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                if (history.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier.fillMaxWidth().padding(32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "No completed entries logged yet.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                } else {
                    items(history) { entry ->
                        val dateFormat = remember { SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()) }
                        val timeFormat = remember { SimpleDateFormat("hh:mm a", Locale.getDefault()) }
                        OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier.padding(16.dp).fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("Tutor Session", fontWeight = FontWeight.Medium)
                                    Text(
                                        text = "${dateFormat.format(entry.clockInTime)} • ${timeFormat.format(entry.clockInTime)} - ${entry.clockOutTime?.let { timeFormat.format(it) } ?: ""}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                val duration = entry.totalHours ?: 0.0
                                Text(
                                    text = String.format(Locale.getDefault(), "%.1f hrs", duration),
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
