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

    suspend fun uploadResource(
        repositoryId: String,
        title: String,
        description: String?,
        fileBody: okhttp3.MultipartBody.Part
    ): Result<ResourceDto> {
        return withContext(Dispatchers.IO) {
            try {
                val repoIdBody = okhttp3.RequestBody.create(okhttp3.MultipartBody.FORM, repositoryId)
                val titleBody = okhttp3.RequestBody.create(okhttp3.MultipartBody.FORM, title)
                val descBody = description?.let { okhttp3.RequestBody.create(okhttp3.MultipartBody.FORM, it) }
                
                val response = resourceApi.uploadResource(repoIdBody, titleBody, descBody, fileBody)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()!!.data!!)
                } else {
                    Result.Error("Failed to upload resource")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
}
