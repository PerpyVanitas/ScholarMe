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
 * Accessible from the bottom navigation for all account types.
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


    if (activeConversationId == null) {
        MessagesListScreen(
            onNavigateToChat = { conversationId ->
                activeConversationId = conversationId
            },
            onBackClick = onNavigateBack
        )
    } else {

        ActiveChatScreen(
            conversationId = activeConversationId!!,
            onNavigateBack = { activeConversationId = null }
        )
    }

}
