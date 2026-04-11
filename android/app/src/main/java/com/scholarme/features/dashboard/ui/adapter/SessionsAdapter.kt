package com.scholarme.features.dashboard.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import coil.load
import coil.transform.CircleCropTransformation
import com.scholarme.R
import com.scholarme.core.data.model.SessionDto
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

/**
 * RecyclerView Adapter for displaying session items.
 * Uses ListAdapter with DiffUtil for efficient updates.
 */
class SessionsAdapter(
    private val onItemClick: (SessionDto) -> Unit = {}
) : ListAdapter<SessionDto, SessionsAdapter.SessionViewHolder>(SessionDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SessionViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_session, parent, false)
        return SessionViewHolder(view, onItemClick)
    }

    override fun onBindViewHolder(holder: SessionViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class SessionViewHolder(
        itemView: View,
        private val onItemClick: (SessionDto) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {
        
        private val ivTutorAvatar: ImageView = itemView.findViewById(R.id.ivTutorAvatar)
        private val tvTutorName: TextView = itemView.findViewById(R.id.tvTutorName)
        private val tvTopic: TextView = itemView.findViewById(R.id.tvTopic)
        private val tvDateTime: TextView = itemView.findViewById(R.id.tvDateTime)
        private val tvDuration: TextView = itemView.findViewById(R.id.tvDuration)
        private val tvStatus: TextView = itemView.findViewById(R.id.tvStatus)
        private val tvLocation: TextView = itemView.findViewById(R.id.tvLocation)

        fun bind(session: SessionDto) {
            // Tutor name
            tvTutorName.text = session.tutorName ?: "Unknown Tutor"
            
            // Topic
            tvTopic.text = session.topic ?: session.specializationName ?: "General Session"
            
            // Date and time formatting
            val formattedDateTime = formatDateTime(session.scheduledAt)
            tvDateTime.text = formattedDateTime
            
            // Duration
            tvDuration.text = "${session.durationMinutes} min"
            
            // Status with color coding
            tvStatus.text = session.status.replaceFirstChar { it.uppercase() }
            tvStatus.setBackgroundResource(getStatusBackground(session.status))
            
            // Location
            if (session.location.isNullOrBlank()) {
                tvLocation.visibility = View.GONE
            } else {
                tvLocation.visibility = View.VISIBLE
                tvLocation.text = session.location
            }
            
            // Avatar
            if (!session.tutorAvatarUrl.isNullOrBlank()) {
                ivTutorAvatar.load(session.tutorAvatarUrl) {
                    crossfade(true)
                    placeholder(R.drawable.ic_person)
                    error(R.drawable.ic_person)
                    transformations(CircleCropTransformation())
                }
            } else {
                ivTutorAvatar.setImageResource(R.drawable.ic_person)
            }
            
            // Click listener
            itemView.setOnClickListener {
                onItemClick(session)
            }
        }
        
        private fun formatDateTime(isoDateTime: String): String {
            return try {
                val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                inputFormat.timeZone = TimeZone.getTimeZone("UTC")
                
                val outputFormat = SimpleDateFormat("MMM dd, yyyy 'at' h:mm a", Locale.getDefault())
                outputFormat.timeZone = TimeZone.getDefault()
                
                val date = inputFormat.parse(isoDateTime)
                date?.let { outputFormat.format(it) } ?: isoDateTime
            } catch (e: Exception) {
                isoDateTime
            }
        }
        
        private fun getStatusBackground(status: String): Int {
            return when (status.lowercase()) {
                "scheduled", "pending" -> R.drawable.bg_status_pending
                "confirmed" -> R.drawable.bg_status_confirmed
                "completed" -> R.drawable.bg_status_completed
                "cancelled" -> R.drawable.bg_status_cancelled
                else -> R.drawable.bg_status_pending
            }
        }
    }
    
    class SessionDiffCallback : DiffUtil.ItemCallback<SessionDto>() {
        override fun areItemsTheSame(oldItem: SessionDto, newItem: SessionDto): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: SessionDto, newItem: SessionDto): Boolean {
            return oldItem == newItem
        }
    }
}
