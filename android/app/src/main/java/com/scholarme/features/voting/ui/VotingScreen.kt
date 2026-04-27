package com.scholarme.features.voting.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ThumbDown
import androidx.compose.material.icons.filled.ThumbUp
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VotingScreen() {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Community Polls", fontWeight = FontWeight.Bold) }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(3) {
                PollCard(
                    question = "Should we add a dark mode strictly for reading?",
                    upvotes = 124,
                    downvotes = 12
                )
            }
        }
    }
}

@Composable
fun PollCard(question: String, upvotes: Int, downvotes: Int) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(question, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Medium)
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Button(onClick = {}, shape = MaterialTheme.shapes.small, variant = "outline") {
                    Icon(Icons.Default.ThumbUp, contentDescription = "Upvote", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(upvotes.toString())
                }
                Button(onClick = {}, shape = MaterialTheme.shapes.small, variant = "outline") {
                    Icon(Icons.Default.ThumbDown, contentDescription = "Downvote", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(downvotes.toString())
                }
            }
        }
    }
}

// Helper extension matching the one in Sessions
@Composable
private fun Button(onClick: () -> Unit, modifier: Modifier = Modifier, variant: String = "primary", content: @Composable RowScope.() -> Unit) {
    if (variant == "outline") {
        OutlinedButton(onClick = onClick, modifier = modifier, shape = MaterialTheme.shapes.small, content = content)
    } else {
        androidx.compose.material3.Button(onClick = onClick, modifier = modifier, shape = MaterialTheme.shapes.small, content = content)
    }
}
