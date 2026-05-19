package com.scholarme.features.availability.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

import androidx.hilt.navigation.compose.hiltViewModel
import com.scholarme.features.availability.data.model.TimeSlotDto
import com.scholarme.core.util.Result

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AvailabilityManagerScreen(
    viewModel: AvailabilityViewModel = hiltViewModel(),
    onBackClick: () -> Unit
) {
    val availabilityResult by viewModel.availability.collectAsState()
    var localSlots by remember { mutableStateOf<List<TimeSlotDto>>(emptyList()) }
    var isAvailable by remember { mutableStateOf(true) }

    LaunchedEffect(availabilityResult) {
        if (availabilityResult is Result.Success) {
            localSlots = (availabilityResult as Result.Success<List<TimeSlotDto>>).data
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Availability", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    TextButton(onClick = {
                        viewModel.saveAvailability(localSlots)
                    }) {
                        Text("Save", fontWeight = FontWeight.Bold)
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(Modifier.weight(1f)) {
                        Text("Accepting Sessions", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                        Text("Toggle if you are currently taking new students", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Switch(
                        checked = isAvailable, 
                        onCheckedChange = { 
                            isAvailable = it
                            viewModel.toggleTutorStatus(it)
                        }
                    )
                }
            }

            Text("Weekly Schedule", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            
            when (val result = availabilityResult) {
                is Result.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
                }
                is Result.Error -> {
                    Text(result.message, color = MaterialTheme.colorScheme.error)
                }
                is Result.Success -> {
                    val days = listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
                    
                    days.forEach { day ->
                        val slot = localSlots.find { it.day.equals(day, ignoreCase = true) }
                        val isActive = slot?.isActive ?: false
                        val timeRange = if (slot != null) "${slot.startTime} - ${slot.endTime}" else "09:00 - 17:00"
                        
                        AvailabilityDayCard(
                            day = day,
                            timeRange = timeRange,
                            isActive = isActive,
                            onCheckedChange = { checked ->
                                val updatedSlots = localSlots.toMutableList()
                                val existingIndex = updatedSlots.indexOfFirst { it.day.equals(day, ignoreCase = true) }
                                if (existingIndex != -1) {
                                    updatedSlots[existingIndex] = updatedSlots[existingIndex].copy(isActive = checked)
                                } else {
                                    updatedSlots.add(
                                        TimeSlotDto(
                                            id = "",
                                            day = day,
                                            startTime = "09:00",
                                            endTime = "17:00",
                                            isActive = checked
                                        )
                                    )
                                }
                                localSlots = updatedSlots
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AvailabilityDayCard(
    day: String, 
    timeRange: String, 
    isActive: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    OutlinedCard(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isActive) MaterialTheme.colorScheme.surface else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(day, fontWeight = FontWeight.Bold)
                Text(timeRange, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Checkbox(checked = isActive, onCheckedChange = onCheckedChange)
        }
    }
}
