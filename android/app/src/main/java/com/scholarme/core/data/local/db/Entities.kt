package com.scholarme.core.data.local.db

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.scholarme.core.data.model.StudySetItem

@Entity(tableName = "offline_study_sets")
data class StudySetEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String?,
    val lastAccessed: Long = System.currentTimeMillis()
)

@Entity(tableName = "offline_study_items")
data class StudyItemEntity(
    @PrimaryKey(autoGenerate = true) val localId: Int = 0,
    val setId: String,
    val term: String,
    val definition: String
)

@Entity(tableName = "offline_resources")
data class ResourceEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String?,
    val url: String?,
    val fileType: String?,
    val fileSize: Long?
)
