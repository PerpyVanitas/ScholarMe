package com.scholarme.features.profile.ui.change_password

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.scholarme.core.util.Result

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChangePasswordScreen(
    changeResult: Result<Unit>?,
    onBackClick: () -> Unit,
    onSubmit: (String, String) -> Unit
) {
    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Change Password", fontWeight = FontWeight.Bold) },
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
            OutlinedTextField(
                value = currentPassword,
                onValueChange = { currentPassword = it },
                label = { Text("Current Password") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                trailingIcon = {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility, null)
                    }
                }
            )

            OutlinedTextField(
                value = newPassword,
                onValueChange = { newPassword = it },
                label = { Text("New Password") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = PasswordVisualTransformation()
            )

            OutlinedTextField(
                value = confirmPassword,
                onValueChange = { confirmPassword = it },
                label = { Text("Confirm New Password") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = PasswordVisualTransformation(),
                isError = confirmPassword.isNotEmpty() && confirmPassword != newPassword
            )

            if (confirmPassword.isNotEmpty() && confirmPassword != newPassword) {
                Text("Passwords do not match", color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }

            if (changeResult is Result.Error) {
                Text(changeResult.message, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }

            if (changeResult is Result.Success) {
                Text("Password changed successfully", color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.bodySmall)
            }

            if (changeResult is Result.Loading) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }

            Button(
                onClick = { onSubmit(currentPassword, newPassword) },
                modifier = Modifier.fillMaxWidth(),
                enabled = newPassword.isNotEmpty() && newPassword == confirmPassword && changeResult !is Result.Loading,
                shape = MaterialTheme.shapes.medium
            ) {
                Text("Update Password", fontWeight = FontWeight.Bold)
            }
        }
    }
}
