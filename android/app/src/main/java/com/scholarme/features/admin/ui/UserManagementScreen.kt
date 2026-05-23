@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.scholarme.features.admin.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.scholarme.features.profile.data.model.UserProfile
import com.scholarme.core.util.Result
import kotlinx.coroutines.launch

@Composable
fun UserManagementScreen(
    viewModel: UserManagementViewModel = hiltViewModel(),
    onBackClick: () -> Unit,
    onViewLogsClick: (String, String) -> Unit
) {
    val usersResult by viewModel.users.collectAsState()
    val actionStatus by viewModel.actionStatus.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    val snackbarHostState = remember { SnackbarHostState() }
    var showCreateDialog by remember { mutableStateOf(false) }

    LaunchedEffect(actionStatus) {
        if (actionStatus is Result.Success) {
            snackbarHostState.showSnackbar("Action completed successfully")
            viewModel.resetActionStatus()
            showCreateDialog = false
        } else if (actionStatus is Result.Error) {
            snackbarHostState.showSnackbar((actionStatus as Result.Error).message)
            viewModel.resetActionStatus()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("Manage Users", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Create User")
            }
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
                onValueChange = { searchQuery = it },
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
                    val users = if (searchQuery.isNotBlank()) {
                        result.data.filter { user ->
                            user.fullName?.contains(searchQuery, ignoreCase = true) == true ||
                            user.email?.contains(searchQuery, ignoreCase = true) == true
                        }
                    } else {
                        result.data
                    }
                    
                    if (users.isEmpty()) {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("No users found", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    } else {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                            contentPadding = PaddingValues(bottom = 80.dp)
                        ) {
                            items(users.size) { index ->
                                UserAdminCard(
                                    user = users[index],
                                    onLogsClick = onViewLogsClick,
                                    onEditUser = { id, name, email, role, pass -> viewModel.editUser(id, name, email, role, pass) },
                                    onDeleteUser = { id -> viewModel.deleteUser(id) },
                                    onToggleCard = { id, issued -> viewModel.toggleCardStatus(id, issued) },
                                    isLoading = actionStatus is Result.Loading
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        CreateUserDialog(
            onDismiss = { showCreateDialog = false },
            onCreate = { email, pass, name, role ->
                viewModel.createUser(email, pass, name, role)
            },
            isLoading = actionStatus is Result.Loading
        )
    }
}

@Composable
fun UserAdminCard(
    user: UserProfile,
    onLogsClick: (String, String) -> Unit,
    onEditUser: (String, String, String, String, String?) -> Unit,
    onDeleteUser: (String) -> Unit,
    onToggleCard: (String, Boolean) -> Unit,
    isLoading: Boolean
) {
    var expanded by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showCardDialog by remember { mutableStateOf(false) }

    val name = user.fullName ?: "Unknown"
    val email = user.email ?: ""
    val role = user.role ?: "learner"
    val id = user.id ?: ""

    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text(email, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = MaterialTheme.shapes.small
                    ) {
                        Text(
                            role.uppercase(), 
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                    Spacer(Modifier.width(8.dp))
                    Box {
                        IconButton(onClick = { expanded = true }) {
                            Icon(Icons.Default.MoreVert, contentDescription = "Actions")
                        }
                        DropdownMenu(
                            expanded = expanded,
                            onDismissRequest = { expanded = false }
                        ) {
                            DropdownMenuItem(
                                text = { Text("Edit User") },
                                onClick = { expanded = false; showEditDialog = true },
                                leadingIcon = { Icon(Icons.Default.Edit, contentDescription = null) }
                            )
                            DropdownMenuItem(
                                text = { Text("Card Management") },
                                onClick = { expanded = false; showCardDialog = true },
                                leadingIcon = { Icon(Icons.Default.Badge, contentDescription = null) }
                            )
                            DropdownMenuItem(
                                text = { Text("Audit Logs") },
                                onClick = { expanded = false; onLogsClick(id, name) },
                                leadingIcon = { Icon(Icons.Default.History, contentDescription = null) }
                            )
                            Divider()
                            DropdownMenuItem(
                                text = { Text("Delete User", color = MaterialTheme.colorScheme.error) },
                                onClick = { expanded = false; showDeleteDialog = true },
                                leadingIcon = { Icon(Icons.Default.Delete, contentDescription = null, tint = MaterialTheme.colorScheme.error) }
                            )
                        }
                    }
                }
            }
        }
    }

    if (showEditDialog) {
        EditUserDialog(
            user = user,
            onDismiss = { showEditDialog = false },
            onEdit = { n, e, r, p -> onEditUser(id, n, e, r, p); showEditDialog = false },
            isLoading = isLoading
        )
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete User") },
            text = { Text("Are you sure you want to permanently delete $name? This will remove their profile and sessions. This cannot be undone.") },
            confirmButton = {
                Button(
                    onClick = { onDeleteUser(id); showDeleteDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Delete User")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) { Text("Cancel") }
            }
        )
    }

    if (showCardDialog) {
        AlertDialog(
            onDismissRequest = { showCardDialog = false },
            title = { Text("CARD MANAGEMENT", color = Color(0xFFFFD700), fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("Manage the physical card status for $name.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(16.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Card Status:", fontWeight = FontWeight.SemiBold)
                        Text(if (user.isCardIssued) "ISSUED" else "NOT ISSUED", color = if (user.isCardIssued) Color(0xFF4CAF50) else Color(0xFFF44336), fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Unique ID:", fontWeight = FontWeight.SemiBold)
                        Text(user.uniqueIdNumber ?: "PENDING", fontWeight = FontWeight.Medium)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { onToggleCard(id, !user.isCardIssued); showCardDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = if (user.isCardIssued) MaterialTheme.colorScheme.surfaceVariant else Color(0xFFFFD700)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(if (user.isCardIssued) "Mark as Not Issued" else "Mark as Issued", color = if (user.isCardIssued) MaterialTheme.colorScheme.onSurface else Color.Black)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCardDialog = false }, modifier = Modifier.fillMaxWidth()) { Text("Cancel") }
            }
        )
    }
}

@Composable
fun CreateUserDialog(
    onDismiss: () -> Unit,
    onCreate: (String, String, String, String) -> Unit,
    isLoading: Boolean
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("learner") }
    var passwordVisible by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create New User") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = name, onValueChange = { name = it },
                    label = { Text("Full Name") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = email, onValueChange = { email = it },
                    label = { Text("Email") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = password, onValueChange = { password = it },
                    label = { Text("Password") },
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff, null)
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                )
                Text("Role", style = MaterialTheme.typography.labelMedium)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    listOf("learner", "tutor", "administrator").forEach { r ->
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { role = r }) {
                            RadioButton(selected = role == r, onClick = { role = r })
                            Text(r.replaceFirstChar { it.uppercase() }, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = { onCreate(email, password, name, role) }, enabled = !isLoading) {
                Text("Create User")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@Composable
fun EditUserDialog(
    user: UserProfile,
    onDismiss: () -> Unit,
    onEdit: (String, String, String, String?) -> Unit,
    isLoading: Boolean
) {
    var name by remember { mutableStateOf(user.fullName ?: "") }
    var email by remember { mutableStateOf(user.email ?: "") }
    var password by remember { mutableStateOf("") }
    var role by remember { mutableStateOf(user.role ?: "learner") }
    var passwordVisible by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit User") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = name, onValueChange = { name = it },
                    label = { Text("Full Name") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = email, onValueChange = { email = it },
                    label = { Text("Email") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    modifier = Modifier.fillMaxWidth()
                )
                Text("Role", style = MaterialTheme.typography.labelMedium)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    listOf("learner", "tutor", "administrator").forEach { r ->
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { role = r }) {
                            RadioButton(selected = role == r, onClick = { role = r })
                            Text(r.replaceFirstChar { it.uppercase() }, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
                OutlinedTextField(
                    value = password, onValueChange = { password = it },
                    label = { Text("New Password (Optional)") },
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff, null)
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(onClick = { onEdit(name, email, role, password.ifBlank { null }) }, enabled = !isLoading) {
                Text("Save Changes")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
