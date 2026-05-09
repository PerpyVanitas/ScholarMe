package com.scholarme.features.messaging.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import androidx.hilt.navigation.compose.hiltViewModel
import dagger.hilt.android.AndroidEntryPoint

/**
 * MessagingActivity — entry point for the messaging feature.
 * Hosts the MessagesListScreen and navigates to ActiveChatScreen.
 */
@AndroidEntryPoint
class MessagingActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MessagingNavHost(
                onNavigateBack = { finish() }
            )
        }
    }
}

@Composable
fun MessagingNavHost(onNavigateBack: () -> Unit) {
    var activeConversationId by remember { mutableStateOf<String?>(null) }
    val viewModel: MessagingViewModel = hiltViewModel()
    val uiState by viewModel.uiState.collectAsState()
    val chatState by viewModel.chatState.collectAsState()

    if (activeConversationId == null) {
        MessagesListScreen(
            state = uiState,
            onNavigateToChat = { conversationId ->
                activeConversationId = conversationId
                viewModel.loadMessages(conversationId)
            },
            onBackClick = onNavigateBack
        )
    } else {
        ActiveChatScreen(
            conversationId = activeConversationId!!,
            state = chatState,
            onSendMessage = { viewModel.sendMessage(activeConversationId!!, it) },
            onNavigateBack = { activeConversationId = null }
        )
    }
}
