package com.scholarme.core.util.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.scholarme.core.util.QrGenerator

@Composable
fun AndroidQrIdCard(
    userId: String,
    userName: String,
    role: String
) {
    val qrBitmap = remember(userId) {
        QrGenerator.generateQrCode(userId, 512)
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
        Column {
            // Header
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.primary)
                    .padding(16.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.School, contentDescription = null, tint = Color.White)
                    Spacer(Modifier.width(12.dp))
                    Text(
                        "ScholarMe Digital ID",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                }
            }

            // QR Code
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                qrBitmap?.let {
                    Surface(
                        modifier = Modifier
                            .size(200.dp)
                            .padding(8.dp),
                        color = Color.White,
                        shape = RoundedCornerShape(12.dp),
                        shadowElevation = 2.dp
                    ) {
                        Image(
                            bitmap = it.asImageBitmap(),
                            contentDescription = "User QR ID",
                            modifier = Modifier.padding(8.dp)
                        )
                    }
                }

                Spacer(Modifier.height(24.dp))

                Text(
                    userName.uppercase(),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.sp
                )
                
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = RoundedCornerShape(100.dp),
                    modifier = Modifier.padding(top = 8.dp)
                ) {
                    Text(
                        role.uppercase(),
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }

                Spacer(Modifier.height(32.dp))
                
                Text(
                    "ID: ${userId.take(8)}...${userId.takeLast(8)}",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
