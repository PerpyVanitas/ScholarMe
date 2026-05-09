package com.scholarme.core.data.model

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ErrorDetails? = null,
    val timestamp: String? = null
)

data class ErrorDetails(
    val code: String,
    val message: String,
    val details: Any? = null
)

data class PaginationInfo(
    val page: Int,
    val limit: Int,
    val total: Long,
    val pages: Int
)
