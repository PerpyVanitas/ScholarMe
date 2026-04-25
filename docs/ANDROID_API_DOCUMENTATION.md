# ScholarMe Android App API Documentation

## Base URL
```
https://your-domain.com/api/android
```

## Authentication
All endpoints except `/auth/login` and `/auth/register` require Bearer token authentication via the `Authorization` header:
```
Authorization: Bearer {access_token}
```

---

## Endpoints

### 1. User Registration
**Endpoint:** `POST /auth/register`

**Description:** Register a new user account

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phoneNumber": "+639171234567",
  "accountType": "learner" // or "tutor"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "userId": "uuid-string",
    "email": "john@example.com",
    "requiresVerification": true
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "message": "Error message",
  "errorCode": "SIGNUP_ERROR"
}
```

---

### 2. User Login
**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and retrieve access token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "uuid-string",
    "email": "john@example.com",
    "session": "access_token_string",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "avatarUrl": "https://...",
      "phoneNumber": "+639171234567",
      "birthdate": "1990-01-01"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "errorCode": "LOGIN_ERROR"
}
```

---

### 3. Get User Profile
**Endpoint:** `GET /auth/profile`

**Description:** Retrieve current user's profile information

**Headers:**
```
Authorization: Bearer {access_token}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid-string",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+639171234567",
    "birthdate": "1990-01-01",
    "avatarUrl": "https://...",
    "accountType": "learner",
    "profileCompleted": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "tutorStats": null // or object if account type is tutor
  }
}
```

**Tutor Stats (if accountType is "tutor"):**
```json
{
  "tutorStats": {
    "rating": 4.8,
    "totalRatings": 25,
    "yearsExperience": 5,
    "hourlyRate": 1500
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

### 4. Update User Profile
**Endpoint:** `PUT /auth/update-profile`

**Description:** Update user profile information

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+639171234567",
  "birthdate": "1990-01-01",
  "bio": "I specialize in Mathematics" // optional, for tutors
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "phoneNumber": "+639171234567",
    "birthdate": "1990-01-01"
  }
}
```

**Error Response (400/401):**
```json
{
  "success": false,
  "message": "Error message"
}
```

---

### 5. Change Password
**Endpoint:** `POST /auth/change-password`

**Description:** Change user's password

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "oldPassword": "currentPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**

401 - Unauthorized:
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

429 - Too Many Attempts:
```json
{
  "success": false,
  "message": "Too many password change attempts. Try again in X minute(s)."
}
```

400 - Invalid Request:
```json
{
  "success": false,
  "message": "New password must be at least 8 characters"
}
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `LOGIN_ERROR` | 401 | Login failed (invalid credentials) |
| `SIGNUP_ERROR` | 400 | Registration failed |
| `SERVER_ERROR` | 500 | Unexpected server error |
| (No code) | 401 | Token expired or invalid |
| (No code) | 429 | Rate limit exceeded |

---

## Implementation Notes for Android

### 1. Token Storage
- Store the `session` token securely using Android's KeyStore
- Include it in all subsequent API requests
- Refresh/re-authenticate when token expires (401 response)

### 2. Response Handling
- Always check `success` field first
- Display `message` to users for errors
- Handle `errorCode` for programmatic error handling

### 3. Rate Limiting
- Password changes are limited to 5 attempts per hour
- Implement exponential backoff for failed login attempts

### 4. Validation
- Email validation on client side before sending
- Password must be minimum 8 characters
- Phone number format: Philippine format (+63 or 09)

### 5. Retrofit Configuration Example
```kotlin
object ApiClient {
    private const val BASE_URL = "https://your-domain.com/api/android/"
    
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor { chain ->
            val token = getStoredToken() // from secure storage
            val request = chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
            chain.proceed(request)
        }
        .build()
    
    val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
}
```

---

## Testing
Use Postman or curl to test endpoints:

```bash
# Register
curl -X POST https://your-domain.com/api/android/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "phoneNumber": "+639171234567",
    "accountType": "learner"
  }'

# Login
curl -X POST https://your-domain.com/api/android/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'

# Get Profile (with token)
curl -X GET https://your-domain.com/api/android/auth/profile \
  -H "Authorization: Bearer {access_token}"
```
