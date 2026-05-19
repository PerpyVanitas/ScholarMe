package com.scholarme.features.admin.data.model

data class AdminAnalytics(
    val totalRevenue: Double,
    val userGrowth: List<DataPoint>,
    val sessionSuccessRate: Double,
    val topSpecializations: List<StringCount>
)

data class DataPoint(val label: String, val value: Double)
data class StringCount(val name: String, val count: Int)

data class AuditLogEntry(
    val id: String,
    val userId: String,
    val action: String,
    val entityType: String,
    val entityId: String,
    val details: String?,
    val timestamp: String
)

data class AdminTimesheet(
    val id: String,
    val tutorId: String,
    val tutorName: String,
    val totalHours: Double,
    val amount: Double,
    val status: String,
    val periodStart: String,
    val periodEnd: String
)
