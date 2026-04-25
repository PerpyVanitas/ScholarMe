package com.scholarme.core.auth

import com.scholarme.core.network.NetworkResult

/**
 * Interface for handling user logout operations across features.
 * Extracted into core to prevent features from depending directly on AuthRepository,
 * maintaining strict Vertical Slice boundaries.
 */
interface LogoutHandler {
    /**
     * Logs out the current user and clears all session data.
     */
    suspend fun logout(): NetworkResult<Unit>
}
