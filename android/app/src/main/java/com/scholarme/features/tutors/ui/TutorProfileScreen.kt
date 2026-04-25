package com.scholarme.features.tutors.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TutorProfileScreen(
    tutorId: String,
    onBackClick: () -> Unit,
    onBookSessionClick: (String) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tutor Profile") },
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
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Tutor #$tutorId", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                    Text("Expert in Mathematics & Physics", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Bio", fontWeight = FontWeight.SemiBold)
                    Text("Passionate educator with 5+ years of experience helping students excel in STEM fields.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            Button(
                onClick = { onBookSessionClick(tutorId) },
                modifier = Modifier.fillMaxWidth(),
                size = ButtonDefaults.LargeButtonSize
            ) {
                Text("Book a Session")
            }
        }
    }
}

// Temporary extension for missing size
val ButtonDefaults.LargeButtonSize get() = Modifier.height(56.dp)
