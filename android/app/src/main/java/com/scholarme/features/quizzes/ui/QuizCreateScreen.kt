package com.scholarme.features.quizzes.ui

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
import com.scholarme.features.quizzes.data.model.GenerateQuizRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuizCreateScreen(
    isLoading: Boolean,
    onGenerate: (GenerateQuizRequest) -> Unit,
    onBackClick: () -> Unit
) {
    var topic by remember { mutableStateOf("") }
    var generationMethod by remember { mutableStateOf("topic") } // "topic" or "document"

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Create Study Quiz", fontWeight = FontWeight.Bold) },
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
            Text("How would you like to generate your quiz?", style = MaterialTheme.typography.titleMedium)
            
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
                    label = { Text("What do you want to study?") },
                    placeholder = { Text("e.g. World War II History") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            } else {
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Select a Document (Coming Soon)", style = MaterialTheme.typography.labelMedium)
                        // Integration with Resource Picker goes here
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = { 
                    if (topic.isNotBlank()) {
                        onGenerate(GenerateQuizRequest(topic = topic))
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
