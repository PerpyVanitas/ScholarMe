package com.scholarme.features.flashcards.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.scholarme.features.flashcards.data.model.GenerateFlashcardRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FlashcardListScreen(
    viewModel: FlashcardViewModel = hiltViewModel(),
    onStudyFlashcard: (String) -> Unit,
    onBackClick: () -> Unit
) {
    val flashcards by viewModel.flashcards.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    var showGenerateDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("flashcards & Study Sets", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showGenerateDialog = true }) {
                Icon(Icons.Default.AutoAwesome, contentDescription = "Generate with AI")
            }
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (isLoading && flashcards.isEmpty()) {
                CircularProgressIndicator(modifier = Modifier.align(androidx.compose.ui.Alignment.Center))
            } else if (flashcards.isEmpty()) {
                Text(
                    text = "No study sets found. Generate one using AI!",
                    modifier = Modifier.align(androidx.compose.ui.Alignment.Center),
                    style = MaterialTheme.typography.bodyLarge
                )
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item { Spacer(modifier = Modifier.height(8.dp)) }
                    items(flashcards) { Flashcard ->
                        FlashcardCard(
                            id = Flashcard.id,
                            title = Flashcard.title,
                            subject = Flashcard.description ?: "General",
                            questionsCount = Flashcard.questionCount,
                            onStudy = onStudyFlashcard
                        )
                    }
                    item { Spacer(modifier = Modifier.height(80.dp)) }
                }
            }
        }
    }

    if (showGenerateDialog) {
        var title by remember { mutableStateOf("") }
        var topic by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showGenerateDialog = false },
            title = { Text("Generate Study Set") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Title") },
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = topic,
                        onValueChange = { topic = it },
                        label = { Text("Topic to generate questions about") },
                        minLines = 2
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (title.isNotBlank() && topic.isNotBlank()) {
                            viewModel.generateFlashcard(
                                GenerateFlashcardRequest(title = title, topic = topic),
                                onSuccess = { showGenerateDialog = false }
                            )
                        }
                    },
                    enabled = !isLoading && title.isNotBlank() && topic.isNotBlank()
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                        Text("Generate")
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { showGenerateDialog = false }, enabled = !isLoading) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun FlashcardCard(
    id: String,
    title: String, 
    subject: String, 
    questionsCount: Int, 
    onStudy: (String) -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
        shape = MaterialTheme.shapes.medium,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            Text("$subject • $questionsCount Questions", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = { onStudy(id) }, 
                    modifier = Modifier.weight(1f),
                    shape = MaterialTheme.shapes.small
                ) {
                    Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Study Flashcards")
                }
            }
        }
    }
}
