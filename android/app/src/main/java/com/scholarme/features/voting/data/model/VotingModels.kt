package com.scholarme.features.voting.data.model

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
