package com.scholarme.features.voting.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.voting.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface VotingApi {
    @GET("polls")
    suspend fun getActivePolls(): Response<ApiResponse<List<PollDto>>>

    @POST("polls/{id}/vote")
    suspend fun castVote(
        @Path("id") pollId: String,
        @Body request: Map<String, String>
    ): Response<ApiResponse<Unit>>
}
