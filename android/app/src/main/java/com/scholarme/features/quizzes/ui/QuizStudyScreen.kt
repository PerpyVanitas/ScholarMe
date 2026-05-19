package com.scholarme.features.quizzes.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.scholarme.features.quizzes.data.model.StudySetItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuizStudyScreen(
    title: String,
    items: List<StudySetItem>,
    onClose: () -> Unit
) {
    var currentIndex by remember { mutableStateOf(0) }
    var isFlipped by remember { mutableStateOf(false) }
    
    // Rotation animation
    val rotation by animateFloatAsState(
        targetValue = if (isFlipped) 180f else 0f,
        animationSpec = tween(durationMillis = 500)
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title) },
                navigationIcon = {
                    IconButton(onClick = onClose) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }
            )
        }
    ) { padding ->
        if (items.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("This study set is empty.")
            }
        } else {
            val currentItem = items[currentIndex]

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // Progress Bar
                LinearProgressIndicator(
                    progress = (currentIndex + 1).toFloat() / items.size,
                    modifier = Modifier.fillMaxWidth().height(8.dp),
                    strokeCap = androidx.compose.ui.graphics.StrokeCap.Round
                )
                Text(
                    "Card ${currentIndex + 1} of ${items.size}",
                    modifier = Modifier.padding(top = 8.dp),
                    style = MaterialTheme.typography.bodySmall
                )

                Spacer(modifier = Modifier.height(48.dp))

                // Flashcard
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(0.8f)
                        .graphicsLayer {
                            rotationY = rotation
                            cameraDistance = 12f * density
                        }
                        .clickable { isFlipped = !isFlipped },
                    contentAlignment = Alignment.Center
                ) {
                    Card(
                        modifier = Modifier.fillMaxSize(),
                        shape = RoundedCornerShape(24.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (rotation <= 90f || rotation >= 270f) 
                                MaterialTheme.colorScheme.primaryContainer 
                            else 
                                MaterialTheme.colorScheme.secondaryContainer
                        )
                    ) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            if (rotation <= 90f || rotation >= 270f) {
                                // Front Side (Term)
                                Text(
                                    text = currentItem.term,
                                    style = MaterialTheme.typography.headlineMedium,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(24.dp)
                                )
                            } else {
                                // Back Side (Definition) - Rotated back to readable
                                Text(
                                    text = currentItem.definition,
                                    style = MaterialTheme.typography.bodyLarge,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier
                                        .padding(24.dp)
                                        .graphicsLayer { rotationY = 180f }
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(48.dp))

                // Navigation Controls
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = {
                            if (currentIndex > 0) {
                                currentIndex--
                                isFlipped = false
                            }
                        },
                        enabled = currentIndex > 0
                    ) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Previous")
                    }

                    Button(
                        onClick = { isFlipped = !isFlipped },
                        shape = RoundedCornerShape(50)
                    ) {
                        Text(if (isFlipped) "Show Term" else "Show Definition")
                    }

                    IconButton(
                        onClick = {
                            if (currentIndex < items.size - 1) {
                                currentIndex++
                                isFlipped = false
                            }
                        },
                        enabled = currentIndex < items.size - 1
                    ) {
                        Icon(Icons.Default.ArrowForward, contentDescription = "Next")
                    }
                }
            }
        }
    }
}
