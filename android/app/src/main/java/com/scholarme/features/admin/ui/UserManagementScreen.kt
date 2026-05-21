@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.scholarme.features.admin.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.clickable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

import androidx.compose.runtime.*
import androidx.hilt.navigation.compose.hiltViewModel
import com.scholarme.features.profile.data.model.UserProfile
import com.scholarme.core.util.Result

@Composable
fun UserManagementScreen(
    viewModel: UserManagementViewModel = hiltViewModel(),
    onBackClick: () -> Unit,
    onViewLogsClick: (String, String) -> Unit
) {
    val usersResult by viewModel.users.collectAsState()
    var searchQuery by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Manage Users", fontWeight = FontWeight.Bold) },
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
                .padding(horizontal = 16.dp)
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { 
                    searchQuery = it
                    viewModel.loadUsers(search = it)
                },
                placeholder = { Text("Search by name or email...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search") },
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.medium
            )
            
            Spacer(modifier = Modifier.height(16.dp))

            when (val result = usersResult) {
                is Result.Loading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                is Result.Error -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(result.message, color = MaterialTheme.colorScheme.error)
                    }
                }
                is Result.Success -> {
                    val users = result.data
                    if (users.isEmpty()) {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("No users found")
                        }
                    } else {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            items(users.size) { index ->
                                val user = users[index]
                                UserAdminCard(
                                    id = user.id ?: "",
                                    name = user.fullName ?: "Unknown",
                                    email = user.email ?: "",
                                    role = user.role ?: "learner",
                                    onLogsClick = onViewLogsClick,
                                    onRoleChange = { viewModel.updateUserRole(user.id!!, it) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun UserAdminCard(
    id: String,
    name: String, 
    email: String, 
    role: String,
    onLogsClick: (String, String) -> Unit,
    onRoleChange: (String) -> Unit
) {
    var showRoleDialog by remember { mutableStateOf(false) }

    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Column {
                    Text(name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text(email, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Surface(
                    color = androidx.compose.ui.graphics.Color(0xFFFFD700),
                    shape = MaterialTheme.shapes.small,
                    modifier = Modifier.clickable { showRoleDialog = true }
                ) {
                    Text(
                        role.uppercase(), 
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = androidx.compose.ui.graphics.Color.Black
                    )
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = { onLogsClick(id, name) }, 
                    modifier = Modifier.weight(1f), 
                    shape = MaterialTheme.shapes.small
                ) {
                    Icon(Icons.Default.History, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Audit Logs", style = MaterialTheme.typography.labelMedium)
                }
                Button(
                    onClick = { showRoleDialog = true }, 
                    modifier = Modifier.weight(1f), 
                    shape = MaterialTheme.shapes.small
                ) {
                    Icon(Icons.Default.Security, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Change Role", style = MaterialTheme.typography.labelMedium)
                }
            }
        }
    }

    if (showRoleDialog) {
        AlertDialog(
            onDismissRequest = { showRoleDialog = false },
            title = { Text("Change User Role") },
            text = {
                Column {
                    listOf("learner", "tutor", "administrator").forEach { r ->
                        Row(
                            Modifier.fillMaxWidth().clickable { 
                                onRoleChange(r)
                                showRoleDialog = false
                            }.padding(12.dp),
                            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                        ) {
                            RadioButton(selected = role == r, onClick = null)
                            Spacer(Modifier.width(12.dp))
                            Text(r.replaceFirstChar { it.uppercase() })
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showRoleDialog = false }) { Text("Cancel") }
            }
        )
    }
}
