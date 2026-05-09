package com.scholarme.features.admin.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.scholarme.features.auth.data.model.AuthCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CardManagementScreen(
    cards: List<AuthCard>,
    onIssueCard: (String, String, String) -> Unit,
    onBackClick: () -> Unit
) {
    var showDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Auth Card Management") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = Color.White
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Issue Card")
            }
        }
    ) { padding ->
        if (cards.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("No active cards found")
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(cards.size) { index ->
                    val card = cards[index]
                    AuthCardItem(card)
                }
            }
        }

        if (showDialog) {
            IssueCardDialog(
                onDismiss = { showDialog = false },
                onConfirm = { uid, cid, pin ->
                    onIssueCard(uid, cid, pin)
                    showDialog = false
                }
            )
        }
    }
}

@Composable
fun AuthCardItem(card: AuthCard) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.CreditCard, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.width(16.dp))
            Column(Modifier.weight(1f)) {
                Text(card.userName ?: "Unknown User", fontWeight = FontWeight.Bold)
                Text("ID: ${card.cardId}", style = MaterialTheme.typography.bodySmall)
                Text("Issued: ${card.createdAt.take(10)}", style = MaterialTheme.typography.bodySmall)
            }
            StatusBadge(card.status)
        }
    }
}

@Composable
fun IssueCardDialog(onDismiss: () -> Unit, onConfirm: (String, String, String) -> Unit) {
    var userId by remember { mutableStateOf("") }
    var cardId by remember { mutableStateOf("") }
    var pin by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Issue New Card") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = userId, onValueChange = { userId = it }, label = { Text("User ID") })
                OutlinedTextField(value = cardId, onValueChange = { cardId = it }, label = { Text("Physical Card ID") })
                OutlinedTextField(value = pin, onValueChange = { pin = it }, label = { Text("6-Digit PIN") })
            }
        },
        confirmButton = {
            Button(onClick = { onConfirm(userId, cardId, pin) }) {
                Text("Issue")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
