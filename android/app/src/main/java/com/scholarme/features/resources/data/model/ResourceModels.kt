package com.scholarme.features.resources.data.model

import com.google.gson.annotations.SerializedName

data class RepositoryDto(
    val id: String,
    @SerializedName("ownerId") val ownerId: String,
    val title: String,
    val description: String? = null,
    @SerializedName("accessRole") val accessRole: String,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("ownerName") val ownerName: String? = null,
    @SerializedName("itemCount") val itemCount: Int = 0
)

data class ResourceDto(
    val id: String,
    @SerializedName("repositoryId") val repositoryId: String,
    val title: String,
    val description: String? = null,
    val url: String,
    @SerializedName("fileType") val fileType: String? = null,
    @SerializedName("uploadedBy") val uploadedBy: String,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("uploaderName") val uploaderName: String? = null
)
