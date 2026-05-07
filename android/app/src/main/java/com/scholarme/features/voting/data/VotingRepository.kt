package com.scholarme.features.voting.data

import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.remote.ApiClient
import com.scholarme.core.data.remote.ApiService
import com.scholarme.core.data.model.AndroidVoteRequest
import com.scholarme.core.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

data class PollOptionDto(
    val id: String,
    val text: String,
    val voteCount: Int
)

data class PollDto(
    val id: String,
    val title: String,
    val description: String,
    val options: List<PollOptionDto>,
    val userVotedOptionId: String? = null,
    val hasVoted: Boolean = false
)

class VotingRepository @Inject constructor(
    private val tokenManager: TokenManager,
    private val apiService: ApiService
) {
    // Secondary constructor for non-Hilt usage
    constructor(tokenManager: TokenManager) : this(tokenManager, ApiClient.apiService)

    private fun getBearerToken(): String? {
        val token = tokenManager.getAccessToken()
        return if (token != null) "Bearer $token" else null
    }

    suspend fun getActivePolls(): NetworkResult<List<PollDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val token = getBearerToken()
                    ?: return@withContext NetworkResult.Error("Not authenticated")

                val response = apiService.getPolls(token)
                if (response.isSuccessful && response.body()?.success == true) {
                    val polls = response.body()?.data?.polls ?: emptyList()
                    NetworkResult.Success(polls.map { p ->
                        PollDto(
                            id = p.id,
                            title = p.title,
                            description = p.description ?: "",
                            options = p.options.map { o ->
                                PollOptionDto(id = o.id, text = o.text, voteCount = o.voteCount)
                            },
                            userVotedOptionId = p.userVotedOptionIds.firstOrNull(),
                            hasVoted = p.hasVoted
                        )
                    })
                } else {
                    NetworkResult.Error(response.body()?.error?.message ?: "Failed to load polls")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error")
            }
        }
    }

    suspend fun castVote(pollId: String, optionId: String): NetworkResult<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val token = getBearerToken()
                    ?: return@withContext NetworkResult.Error("Not authenticated")

                val response = apiService.castVote(token, pollId, AndroidVoteRequest(optionId))
                if (response.isSuccessful && response.body()?.success == true) {
                    NetworkResult.Success(Unit)
                } else {
                    NetworkResult.Error(response.body()?.error?.message ?: "Failed to cast vote")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error")
            }
        }
    }
}
