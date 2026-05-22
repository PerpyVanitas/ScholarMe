package com.scholarme.features.flashcards.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.scholarme.features.flashcards.data.model.GenerateFlashcardRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FlashcardCreateScreen(
    isLoading: Boolean,
    onGenerate: (GenerateFlashcardRequest) -> Unit,
    onBackClick: () -> Unit
) {
    var topic by remember { mutableStateOf("") }
    var generationMethod by remember { mutableStateOf("topic") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Create Flashcard Set", fontWeight = FontWeight.Bold) },
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
            Text("How would you like to generate your flashcards?", style = MaterialTheme.typography.titleMedium)
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = generationMethod == "topic",
                    onClick = { generationMethod = "topic" },
                    label = { Text("From Topic") }
                )
                FilterChip(
                    selected = generationMethod == "document",
                    onClick = { generationMethod = "document" },
                    label = { Text("From Document") }
                )
            }

            if (generationMethod == "topic") {
                OutlinedTextField(
                    value = topic,
                    onValueChange = { topic = it },
                    label = { Text("Flashcard Topic") },
                    placeholder = { Text("e.g. Periodic Table Elements") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            } else {
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Select a Document (Coming Soon)", style = MaterialTheme.typography.labelMedium)
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = { 
                    if (topic.isNotBlank()) {
                        onGenerate(GenerateFlashcardRequest(topic = topic))
                    }
                },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                enabled = !isLoading && (topic.isNotBlank() || generationMethod == "document"),
                shape = MaterialTheme.shapes.small
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                } else {
                    Icon(Icons.Default.AutoAwesome, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("Generate with AI", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
