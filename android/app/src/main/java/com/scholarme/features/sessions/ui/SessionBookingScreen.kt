package com.scholarme.features.sessions.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SessionBookingScreen(
    tutorId: String,
    onBackClick: () -> Unit,
    onBookingComplete: () -> Unit
) {
    var selectedDate by remember { mutableStateOf("Select Date") }
    var selectedTime by remember { mutableStateOf("Select Time") }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Book Session") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
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
            Text("Booking with Tutor #$tutorId", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            
            // Shadcn style dropdown simulation
            OutlinedCard(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.outlinedCardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Date", style = MaterialTheme.typography.labelMedium)
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(onClick = { selectedDate = "Tomorrow, 2:00 PM" }, modifier = Modifier.fillMaxWidth(), variant = "outline") {
                        Text(selectedDate)
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = onBookingComplete,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Confirm Booking")
            }
        }
    }
}

// Helper extension
@Composable
fun Button(onClick: () -> Unit, modifier: Modifier = Modifier, variant: String = "primary", content: @Composable RowScope.() -> Unit) {
    if (variant == "outline") {
        OutlinedButton(onClick = onClick, modifier = modifier, shape = MaterialTheme.shapes.small, content = content)
    } else {
        androidx.compose.material3.Button(onClick = onClick, modifier = modifier, shape = MaterialTheme.shapes.small, content = content)
    }
}
