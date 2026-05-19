package com.scholarme.features.voting.data

import com.scholarme.features.voting.data.model.*
import com.scholarme.features.voting.data.remote.VotingApi
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

class VotingRepository @Inject constructor(
    private val votingApi: VotingApi
) {
    suspend fun getActivePolls(): Result<List<PollDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = votingApi.getActivePolls()
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()?.data ?: emptyList())
                } else {
                    Result.Error("Failed to fetch polls")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun castVote(pollId: String, optionId: String): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val response = votingApi.castVote(pollId, mapOf("optionId" to optionId))
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(Unit)
                } else {
                    Result.Error("Failed to cast vote")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
}
