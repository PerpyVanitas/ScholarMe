package com.scholarme.features.voting.data

import com.scholarme.core.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import javax.inject.Inject

data class PollDto(
    val id: String,
    val title: String,
    val description: String,
    val options: List<PollOptionDto>,
    val userVotedOptionId: String? = null
)

data class PollOptionDto(
    val id: String,
    val text: String,
    val voteCount: Int
)

class VotingRepository @Inject constructor() {
    
    private val mockPolls = mutableListOf(
        PollDto(
            id = "p1",
            title = "Next Semester Workshop Topics",
            description = "What should be the focus of our next student workshop?",
            options = listOf(
                PollOptionDto("o1", "Resume Building", 45),
                PollOptionDto("o2", "Interview Prep", 30),
                PollOptionDto("o3", "Time Management", 15)
            )
        )
    )

    suspend fun getActivePolls(): NetworkResult<List<PollDto>> {
        return withContext(Dispatchers.IO) {
            delay(700)
            NetworkResult.Success(mockPolls.toList())
        }
    }

    suspend fun castVote(pollId: String, optionId: String): NetworkResult<Unit> {
        return withContext(Dispatchers.IO) {
            delay(500)
            
            // Mock vote casting logic
            val pollIndex = mockPolls.indexOfFirst { it.id == pollId }
            if (pollIndex != -1) {
                val poll = mockPolls[pollIndex]
                val updatedOptions = poll.options.map { option ->
                    if (option.id == optionId) option.copy(voteCount = option.voteCount + 1)
                    else option
                }
                mockPolls[pollIndex] = poll.copy(options = updatedOptions, userVotedOptionId = optionId)
                NetworkResult.Success(Unit)
            } else {
                NetworkResult.Error("Poll not found")
            }
        }
    }
}
