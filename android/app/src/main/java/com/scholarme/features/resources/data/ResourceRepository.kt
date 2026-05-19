package com.scholarme.features.resources.data

import com.scholarme.features.resources.data.model.*
import com.scholarme.features.resources.data.remote.ResourceApi
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

class ResourceRepository @Inject constructor(
    private val resourceApi: ResourceApi
) {
    suspend fun getRepositories(search: String? = null): Result<List<RepositoryDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = resourceApi.getRepositories(search)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()!!.data!!)
                } else {
                    Result.Error("Failed to fetch repositories")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun getRepositoryFiles(repositoryId: String): Result<List<ResourceDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = resourceApi.getRepositoryFiles(repositoryId)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()!!.data!!)
                } else {
                    Result.Error("Failed to fetch files")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
}
