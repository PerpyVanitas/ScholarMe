@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.scholarme.features.resources.ui


import androidx.compose.foundation.layout.*

import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.material.icons.filled.Add
import androidx.compose.ui.platform.LocalContext
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import android.widget.Toast
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.hilt.navigation.compose.hiltViewModel
import com.scholarme.features.resources.data.model.RepositoryDto
import com.scholarme.core.util.Result
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.asRequestBody

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResourceDirectoryScreen(
    userRole: String,
    viewModel: ResourceViewModel = hiltViewModel(),
    onBackClick: () -> Unit,
    onRepositoryClick: (String) -> Unit
) {
    val repoResult by viewModel.repositories.collectAsState()
    val context = LocalContext.current
    
    var searchQuery by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf("") }
    
    var showUploadDialog by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(false) }
    var uploadTitle by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf("") }
    var uploadDescription by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf("") }
    var selectedRepoId by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf("") }
    var selectedFileUri by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf<android.net.Uri?>(null) }
    var expanded by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(false) }

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent(),
        onResult = { uri ->
            uri?.let {
                selectedFileUri = it
            }
        }
    )
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Study Resources", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        floatingActionButton = {
            if (userRole.lowercase() == "tutor" || userRole.lowercase() == "administrator") {
                FloatingActionButton(
                    onClick = { showUploadDialog = true },
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Upload Resource")
                }
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
                onValueChange = { 
                    searchQuery = it
                    viewModel.loadRepositories(it.ifEmpty { null })
                },
                placeholder = { Text("Search repositories...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search") },
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.medium
            )
            
            Spacer(modifier = Modifier.height(16.dp))

            when (val result = repoResult) {
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
                    val repos = result.data
                    if (repos.isEmpty()) {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("No repositories found")
                        }
                    } else {
                        LazyVerticalGrid(
                            columns = GridCells.Fixed(2),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(repos.size) { index ->
                                val repo = repos[index]
                                RepositoryCard(
                                    title = repo.title,
                                    itemCount = repo.itemCount,
                                    onClick = { onRepositoryClick(repo.id) }
                                )
                            }
                        }
                    }
                }
            }
            
            if (showUploadDialog) {
                AlertDialog(
                    onDismissRequest = { showUploadDialog = false },
                    title = { Text("Upload Resource") },
                    text = {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            OutlinedTextField(
                                value = uploadTitle,
                                onValueChange = { uploadTitle = it },
                                label = { Text("Title") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth()
                            )
                            OutlinedTextField(
                                value = uploadDescription,
                                onValueChange = { uploadDescription = it },
                                label = { Text("Description (Optional)") },
                                modifier = Modifier.fillMaxWidth()
                            )
                            
                            // Simple exposed dropdown menu for repository selection
                            Box(modifier = Modifier.fillMaxWidth()) {
                                OutlinedTextField(
                                    value = if (selectedRepoId.isEmpty()) "Select Repository" else (repoResult as? Result.Success)?.data?.find { it.id == selectedRepoId }?.title ?: "Select Repository",
                                    onValueChange = {},
                                    readOnly = true,
                                    label = { Text("Repository") },
                                    modifier = Modifier.fillMaxWidth(),
                                    trailingIcon = {
                                        IconButton(onClick = { expanded = !expanded }) {
                                            Icon(if (expanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown, "Expand")
                                        }
                                    }
                                )
                                DropdownMenu(
                                    expanded = expanded,
                                    onDismissRequest = { expanded = false },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    (repoResult as? Result.Success)?.data?.forEach { repo ->
                                        DropdownMenuItem(
                                            text = { Text(repo.title) },
                                            onClick = {
                                                selectedRepoId = repo.id
                                                expanded = false
                                            }
                                        )
                                    }
                                }
                            }

                            Button(
                                onClick = { launcher.launch("*/*") },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(if (selectedFileUri != null) "File Selected" else "Choose File")
                            }
                        }
                    },
                    confirmButton = {
                        TextButton(
                            onClick = {
                                if (selectedRepoId.isNotEmpty() && uploadTitle.isNotEmpty() && selectedFileUri != null) {
                                    val inputStream = context.contentResolver.openInputStream(selectedFileUri!!)
                                    val file = java.io.File(context.cacheDir, "temp_resource_${System.currentTimeMillis()}")
                                    val outputStream = java.io.FileOutputStream(file)
                                    inputStream?.copyTo(outputStream)
                                    inputStream?.close()
                                    outputStream.close()
                                    
                                    val mimeType = context.contentResolver.getType(selectedFileUri!!) ?: "application/octet-stream"
                                    val mediaType = mimeType.toMediaTypeOrNull()
                                    val requestFile = file.asRequestBody(mediaType)
                                    val body = okhttp3.MultipartBody.Part.createFormData("file", file.name, requestFile)
                                    
                                    viewModel.uploadResource(selectedRepoId, uploadTitle, uploadDescription, body)
                                    showUploadDialog = false
                                    selectedFileUri = null
                                    uploadTitle = ""
                                    uploadDescription = ""
                                } else {
                                    Toast.makeText(context, "Please fill required fields", Toast.LENGTH_SHORT).show()
                                }
                            }
                        ) {
                            Text("Upload")
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { showUploadDialog = false }) {
                            Text("Cancel")
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun RepositoryCard(title: String, itemCount: Int, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
        shape = MaterialTheme.shapes.medium,
        modifier = Modifier.fillMaxWidth().aspectRatio(1f)
    ) {
        Column(
            modifier = Modifier.padding(16.dp).fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(Icons.Default.Folder, contentDescription = null, modifier = Modifier.size(48.dp), tint = MaterialTheme.colorScheme.primary)
            Spacer(modifier = Modifier.height(12.dp))
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            Text("$itemCount items", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
