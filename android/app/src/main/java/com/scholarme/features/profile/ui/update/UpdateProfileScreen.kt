package com.scholarme.features.profile.ui.update

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.scholarme.core.util.Result
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.FileOutputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UpdateProfileScreen(
    currentAvatarUrl: String?,
    currentFullName: String,
    currentPhone: String,
    currentBio: String,
    currentDegreeProgram: String?,
    currentYearLevel: Int?,
    currentHourlyRate: Double?,
    currentYearsExperience: Int?,
    userRole: String,
    updateResult: Result<Unit>?,
    onBackClick: () -> Unit,
    onSaveClick: (String, String, String, String?, Int?, Double?, Int?) -> Unit,
    onAvatarSelected: (MultipartBody.Part) -> Unit
) {
    var fullName by remember { mutableStateOf(currentFullName) }
    var phone by remember { mutableStateOf(currentPhone) }
    var bio by remember { mutableStateOf(currentBio) }
    var degreeProgram by remember { mutableStateOf(currentDegreeProgram ?: "") }
    var yearLevel by remember { mutableStateOf(currentYearLevel?.toString() ?: "") }
    var hourlyRate by remember { mutableStateOf(currentHourlyRate?.toString() ?: "") }
    var yearsExperience by remember { mutableStateOf(currentYearsExperience?.toString() ?: "") }
    
    val localContext = LocalContext.current
    
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia(),
        onResult = { uri ->
            uri?.let {
                val inputStream = localContext.contentResolver.openInputStream(it)
                val file = File(localContext.cacheDir, "temp_avatar.jpg")
                val outputStream = FileOutputStream(file)
                inputStream?.copyTo(outputStream)
                inputStream?.close()
                outputStream.close()
                
                val requestFile = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
                val body = MultipartBody.Part.createFormData("file", file.name, requestFile)
                onAvatarSelected(body)
            }
        }
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Edit Profile", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { 
                        onSaveClick(
                            fullName, 
                            phone, 
                            bio, 
                            if (userRole.lowercase() == "learner") degreeProgram.ifEmpty { null } else null,
                            if (userRole.lowercase() == "learner") yearLevel.toIntOrNull() else null,
                            if (userRole.lowercase() == "tutor") hourlyRate.toDoubleOrNull() else null,
                            if (userRole.lowercase() == "tutor") yearsExperience.toIntOrNull() else null
                        ) 
                    }) {
                        Icon(Icons.Default.Save, contentDescription = "Save")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Avatar Picker
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .clickable {
                        launcher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                    },
                contentAlignment = Alignment.Center
            ) {
                AsyncImage(
                    model = currentAvatarUrl ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=$currentFullName",
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(androidx.compose.ui.graphics.Color.Black.copy(alpha = 0.3f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.CameraAlt, contentDescription = null, tint = androidx.compose.ui.graphics.Color.White)
                }
            }

            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = fullName,
                onValueChange = { fullName = it },
                label = { Text("Full Name") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it },
                label = { Text("Phone Number") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            OutlinedTextField(
                value = bio,
                onValueChange = { bio = it },
                label = { Text("Bio") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3
            )

            if (userRole.lowercase() == "learner") {
                OutlinedTextField(
                    value = degreeProgram,
                    onValueChange = { degreeProgram = it },
                    label = { Text("Degree Program") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = yearLevel,
                    onValueChange = { if (it.all { char -> char.isDigit() }) yearLevel = it },
                    label = { Text("Year Level") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                        keyboardType = androidx.compose.ui.text.input.KeyboardType.Number
                    )
                )
            }

            if (userRole.lowercase() == "tutor") {
                OutlinedTextField(
                    value = hourlyRate,
                    onValueChange = { if (it.all { char -> char.isDigit() || char == '.' }) hourlyRate = it },
                    label = { Text("Hourly Rate ($)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                        keyboardType = androidx.compose.ui.text.input.KeyboardType.Decimal
                    )
                )

                OutlinedTextField(
                    value = yearsExperience,
                    onValueChange = { if (it.all { char -> char.isDigit() }) yearsExperience = it },
                    label = { Text("Years of Experience") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                        keyboardType = androidx.compose.ui.text.input.KeyboardType.Number
                    )
                )
            }

            if (updateResult is Result.Error) {
                Text(
                    text = updateResult.message,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }

            if (updateResult is Result.Loading) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }

            Button(
                onClick = { 
                    onSaveClick(
                        fullName, 
                        phone, 
                        bio, 
                        if (userRole.lowercase() == "learner") degreeProgram.ifEmpty { null } else null,
                        if (userRole.lowercase() == "learner") yearLevel.toIntOrNull() else null,
                        if (userRole.lowercase() == "tutor") hourlyRate.toDoubleOrNull() else null,
                        if (userRole.lowercase() == "tutor") yearsExperience.toIntOrNull() else null
                    ) 
                },
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.medium,
                enabled = updateResult !is Result.Loading
            ) {
                Text("Save Changes", fontWeight = FontWeight.Bold)
            }
        }
    }
}
