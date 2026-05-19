@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.scholarme.features.tutors.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.scholarme.features.tutors.data.model.TutorDto
import com.scholarme.core.util.ui.ShimmerTutorCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TutorsScreen(
    state: TutorListState,
    onSearchQueryChanged: (String) -> Unit,
    onTutorClick: (String) -> Unit,
    onBackClick: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Find a Tutor", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(androidx.compose.material.icons.Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            OutlinedTextField(
                value = state.searchQuery,
                onValueChange = onSearchQueryChanged,
                placeholder = { Text("Search subjects or names...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search") },
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.medium,
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(16.dp))

            if (state.isLoading) {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(5) {
                        ShimmerTutorCard()
                    }
                }
            } else if (state.error != null) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Error: ${state.error}", color = MaterialTheme.colorScheme.error)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(state.filteredTutors) { tutor ->
                        TutorCard(tutor = tutor, onClick = { onTutorClick(tutor.id) })
                    }
                    
                    if (state.filteredTutors.isEmpty()) {
                        item {
                            EmptyState("No tutors available")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun EmptyState(message: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(message, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
