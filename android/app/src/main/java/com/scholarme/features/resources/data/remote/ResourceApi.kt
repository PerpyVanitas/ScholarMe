package com.scholarme.features.resources.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.resources.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ResourceApi {
    @GET("resources/repositories")
    suspend fun getRepositories(
        @Query("search") search: String? = null,
        @Query("accessRole") accessRole: String? = null
    ): Response<ApiResponse<List<RepositoryDto>>>

    @GET("resources/repositories/{id}/files")
    suspend fun getRepositoryFiles(
        @Path("id") repositoryId: String
    ): Response<ApiResponse<List<ResourceDto>>>

    @Multipart
    @POST("resources/upload")
    suspend fun uploadResource(
        @Part("repositoryId") repositoryId: okhttp3.RequestBody,
        @Part("title") title: okhttp3.RequestBody,
        @Part("description") description: okhttp3.RequestBody?,
        @Part file: okhttp3.MultipartBody.Part
    ): Response<ApiResponse<ResourceDto>>
}
