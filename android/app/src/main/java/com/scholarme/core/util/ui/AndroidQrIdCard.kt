package com.scholarme.core.util.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.scholarme.R
import com.scholarme.core.util.QrGenerator
import java.util.Calendar

@Composable
fun AndroidQrIdCard(
    userId: String,
    userName: String,
    role: String,
    program: String = "BS INFORMATION TECHNOLOGY",
    studentId: String = "N/A",
    birthdate: String = "N/A",
    avatarUrl: String? = null,
    pin: String = "",
    presidentName: String = "Honor Society President"
) {
    // Compute academic year dynamically: Aug–Dec = Y/(Y+1), Jan–Jul = (Y-1)/Y
    val cal = Calendar.getInstance()
    val month = cal.get(Calendar.MONTH) + 1 // 1-indexed
    val year = cal.get(Calendar.YEAR)
    val academicYear = if (month >= 8) "$year-${year + 1}" else "${year - 1}-$year"
    var flipped by remember { mutableStateOf(false) }
    
    val rotation by animateFloatAsState(
        targetValue = if (flipped) 180f else 0f,
        animationSpec = tween(durationMillis = 600),
        label = "cardFlip"
    )

    val frontAlpha by animateFloatAsState(
        targetValue = if (rotation > 90f) 0f else 1f,
        animationSpec = tween(0),
        label = "frontAlpha"
    )

    val backAlpha by animateFloatAsState(
        targetValue = if (rotation > 90f) 1f else 0f,
        animationSpec = tween(0),
        label = "backAlpha"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(480.dp)
            .padding(vertical = 16.dp)
            .clickable { flipped = !flipped }
            .graphicsLayer {
                rotationY = rotation
                cameraDistance = 12f * density
            },
        contentAlignment = Alignment.Center
    ) {
        // Front Side
        if (frontAlpha > 0f) {
            CardFrontSide(
                userName = userName,
                role = role,
                program = program,
                studentId = studentId,
                birthdate = birthdate,
                avatarUrl = avatarUrl,
                modifier = Modifier.graphicsLayer { alpha = frontAlpha }
            )
        }
        
        // Back Side
        if (backAlpha > 0f) {
            CardBackSide(
                userId = userId,
                pin = pin,
                presidentName = presidentName,
                academicYear = academicYear,
                modifier = Modifier.graphicsLayer {
                    alpha = backAlpha
                    rotationY = -180f // Counteract the container rotation so it's not mirrored
                }
            )
        }
    }
}

@Composable
private fun CardFrontSide(
    userName: String,
    role: String,
    program: String,
    studentId: String,
    birthdate: String,
    avatarUrl: String?,
    modifier: Modifier = Modifier
) {
    val goldColor = Color(0xFFFFD700)
    
    Card(
        modifier = modifier
            .width(320.dp)
            .height(480.dp),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(2.dp, goldColor.copy(alpha = 0.3f)),
        elevation = CardDefaults.cardElevation(8.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.linearGradient(
                        colors = listOf(Color(0xFF2D2D2D), Color(0xFF1A1A1A))
                    )
                )
        ) {
            // Watermark Logo
            Image(
                painter = painterResource(id = R.drawable.ic_launcher_foreground),
                contentDescription = null,
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer { alpha = 0.05f }
            )

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            ) {
                // Header
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Image(
                        painter = painterResource(id = R.drawable.ic_launcher_foreground),
                        contentDescription = null,
                        modifier = Modifier.size(36.dp)
                    )
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text("CIT UNIVERSITY", color = Color(0xFFE4E4E7), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text("HONOR SOCIETY", color = goldColor, fontSize = 12.sp, fontWeight = FontWeight.Black)
                    }
                }
                
                Spacer(Modifier.height(12.dp))
                Divider(color = goldColor.copy(alpha = 0.2f))
                Spacer(Modifier.height(24.dp))
                
                // Avatar & Name
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    AsyncImage(
                        model = avatarUrl ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=$userName",
                        contentDescription = "Avatar",
                        modifier = Modifier
                            .size(112.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White)
                            .padding(2.dp)
                            .clip(RoundedCornerShape(10.dp)),
                        contentScale = ContentScale.Crop
                    )
                    
                    Surface(
                        color = goldColor,
                        shape = RoundedCornerShape(100.dp),
                        modifier = Modifier
                            .padding(top = 8.dp)
                            .offset(y = (-12).dp)
                    ) {
                        Text(
                            role.uppercase(),
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 2.dp),
                            color = Color.Black,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                    
                    Text(
                        userName.uppercase(),
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        textAlign = TextAlign.Center
                    )
                }
                
                Spacer(Modifier.weight(1f))
                
                // Details Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("PROGRAM:", color = Color(0xFFA1A1AA), fontSize = 10.sp)
                            Text(program.uppercase(), color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                        Divider(modifier = Modifier.padding(vertical = 8.dp), color = Color.White.copy(alpha = 0.05f))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("STUDENT ID:", color = Color(0xFFA1A1AA), fontSize = 10.sp)
                            Text(studentId.uppercase(), color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                        Divider(modifier = Modifier.padding(vertical = 8.dp), color = Color.White.copy(alpha = 0.05f))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("BIRTHDATE:", color = Color(0xFFA1A1AA), fontSize = 10.sp)
                            Text(birthdate.uppercase(), color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                
                Spacer(Modifier.height(16.dp))
                
                // Footer
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("OFFICIAL DIGITAL PASS", color = Color(0xFFA1A1AA), fontSize = 8.sp, fontWeight = FontWeight.Bold)
                    Text("CEBU, PHILIPPINES", color = goldColor, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun CardBackSide(
    userId: String,
    pin: String,
    presidentName: String,
    academicYear: String,
    modifier: Modifier = Modifier
) {
    val goldColor = Color(0xFFFFD700)
    val qrPayload = "{\"cardId\":\"$userId\",\"pin\":\"$pin\"}"
    val qrBitmap = remember(qrPayload) {
        QrGenerator.generateQrCode(qrPayload, 512)
    }
    
    Card(
        modifier = modifier
            .width(320.dp)
            .height(480.dp),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(2.dp, goldColor.copy(alpha = 0.3f)),
        elevation = CardDefaults.cardElevation(8.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.linearGradient(
                        colors = listOf(Color(0xFF2D2D2D), Color(0xFF1A1A1A))
                    )
                )
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Magnetic Strip
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 32.dp)
                        .height(40.dp)
                        .background(Color(0xFF09090B)),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Image(
                            painter = painterResource(id = R.drawable.ic_launcher_foreground),
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "CIT-U HONOR SOCIETY",
                            color = goldColor,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                    }
                }
                
                Spacer(Modifier.height(16.dp))
                
                Text(
                    "SCAN TO LOG SESSIONS",
                    color = Color(0xFFA1A1AA),
                    fontSize = 8.sp,
                    fontFamily = FontFamily.Monospace,
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center,
                    letterSpacing = 1.sp
                )
                
                Divider(modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp), color = Color.White.copy(alpha = 0.1f))
                
                Spacer(Modifier.weight(1f))
                
                // QR Code
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        qrBitmap?.let {
                            Image(
                                bitmap = it.asImageBitmap(),
                                contentDescription = "QR Code",
                                modifier = Modifier
                                    .size(160.dp)
                                    .padding(12.dp)
                            )
                        }
                    }
                }
                
                Spacer(Modifier.weight(1f))
                
                Text(
                    "MEMBER RECOGNITION SYSTEM",
                    color = Color(0xFFA1A1AA),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center,
                    letterSpacing = 1.sp
                )
                
                Spacer(Modifier.height(16.dp))
                
                Text(
                    "This digital identification card is non-transferable and remains the property of the Cebu Institute of Technology - University Honor Society. If found, please return to the Student Success Office (SSO) or notify sso@cit.edu.",
                    color = Color(0xFFA1A1AA),
                    fontSize = 8.sp,
                    modifier = Modifier.padding(horizontal = 20.dp),
                    textAlign = TextAlign.Center
                )
                
                Spacer(Modifier.height(24.dp))
                
                Text(
                    presidentName,
                    color = goldColor,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center
                )
                
                Text(
                    "HONOR SOCIETY PRESIDENT",
                    color = Color(0xFFA1A1AA),
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center,
                    letterSpacing = 1.sp
                )
                
                Text(
                    "AY $academicYear",
                    color = Color(0xFF71717A),
                    fontSize = 6.sp,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp, top = 4.dp),
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}
