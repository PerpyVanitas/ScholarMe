package com.scholarme.features.resources.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.resources.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ResourceApi {
    @GET("repositories")
    suspend fun getRepositories(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("search") search: String? = null
    ): Response<ApiResponse<RepositoryListResponse>>
    
    @GET("repositories/{id}")
    suspend fun getRepository(
        @Path("id") repoId: String
    ): Response<ApiResponse<RepositoryDto>>
    
    @GET("repositories/{id}/resources")
    suspend fun getResources(
        @Path("id") repoId: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): Response<ApiResponse<ResourceListResponse>>
}
