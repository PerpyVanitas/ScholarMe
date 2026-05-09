package com.scholarme.core.data.local.db

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface OfflineDao {
    
    // Study Sets
    @Query("SELECT * FROM offline_study_sets ORDER BY lastAccessed DESC")
    fun getAllStudySets(): Flow<List<StudySetEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertStudySet(set: StudySetEntity)

    @Query("SELECT * FROM offline_study_items WHERE setId = :setId")
    suspend fun getItemsForSet(setId: String): List<StudyItemEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertStudyItems(items: List<StudyItemEntity>)

    // Resources
    @Query("SELECT * FROM offline_resources")
    fun getAllResources(): Flow<List<ResourceEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertResource(resource: ResourceEntity)

    @Query("DELETE FROM offline_study_sets WHERE id = :setId")
    suspend fun deleteStudySet(setId: String)

    @Query("DELETE FROM offline_study_items WHERE setId = :setId")
    suspend fun deleteStudyItems(setId: String)
}
