package com.scholarme.features.resources.data.model

import com.google.gson.annotations.SerializedName

data class RepositoryDto(
    val id: String,
    val title: String,
    val description: String? = null,
    val visibility: String = "private",
    @SerializedName("ownerId") val ownerId: String,
    @SerializedName("ownerName") val ownerName: String? = null,
    @SerializedName("resourceCount") val resourceCount: Long = 0,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null
)

data class ResourceDto(
    val id: String,
    val title: String,
    val description: String? = null,
    val url: String? = null,
    @SerializedName("fileType") val fileType: String? = null,
    @SerializedName("fileSize") val fileSize: Long? = null,
    @SerializedName("uploadedById") val uploadedById: String? = null,
    @SerializedName("uploadedByName") val uploadedByName: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class RepositoryListResponse(
    val repositories: List<RepositoryDto>
)

data class ResourceListResponse(
    val resources: List<ResourceDto>
)
