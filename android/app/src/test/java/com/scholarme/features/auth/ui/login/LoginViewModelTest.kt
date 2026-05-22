package com.scholarme.features.auth.ui.login

import com.scholarme.core.util.Result
import com.scholarme.features.auth.data.AuthRepository
import com.scholarme.features.profile.data.model.UserProfile
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class LoginViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var authRepository: AuthRepository
    private lateinit var viewModel: LoginViewModel

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        authRepository = mock()
        viewModel = LoginViewModel(authRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `login with empty email sets email error`() {
        viewModel.login("", "password123")
        
        assertEquals("Email is required", viewModel.emailError.value)
        assertEquals(null, viewModel.passwordError.value)
        assertEquals(null, viewModel.loginState.value)
    }

    @Test
    fun `login with empty password sets password error`() {
        viewModel.login("test@example.com", "")
        
        assertEquals(null, viewModel.emailError.value)
        assertEquals("Password is required", viewModel.passwordError.value)
        assertEquals(null, viewModel.loginState.value)
    }

    @Test
    fun `login with valid credentials sets loading then success`() = runTest {
        val mockUser = UserProfile(
            id = "1",
            fullName = "Test User",
            email = "test@example.com",
            role = "LEARNER",
            avatarUrl = null,
            phone = null,
            bio = null,
            degreeProgram = null,
            yearLevel = null,
            isProfileComplete = true
        )
        
        whenever(authRepository.login("test@example.com", "password123")).thenReturn(Result.Success(mockUser))
        
        viewModel.login("test@example.com", "password123")
        
        assertEquals(Result.Loading, viewModel.loginState.value)
        
        testDispatcher.scheduler.advanceUntilIdle()
        
        val finalState = viewModel.loginState.value
        assertTrue(finalState is Result.Success)
        assertEquals("test@example.com", (finalState as Result.Success).data.email)
    }

    @Test
    fun `loginWithCard sets loading then result`() = runTest {
        val mockUser = UserProfile(
            id = "2",
            fullName = "Card User",
            email = "card@example.com",
            role = "LEARNER",
            avatarUrl = null,
            phone = null,
            bio = null,
            degreeProgram = null,
            yearLevel = null,
            isProfileComplete = true
        )

        whenever(authRepository.loginWithCard("card123", "1234")).thenReturn(Result.Success(mockUser))

        viewModel.loginWithCard("card123", "1234")

        assertEquals(Result.Loading, viewModel.loginState.value)

        testDispatcher.scheduler.advanceUntilIdle()

        val finalState = viewModel.loginState.value
        assertTrue(finalState is Result.Success)
        assertEquals("Card User", (finalState as Result.Success).data.fullName)
    }

    @Test
    fun `clearState resets all flows`() {
        viewModel.login("", "")
        viewModel.clearState()
        
        assertEquals(null, viewModel.emailError.value)
        assertEquals(null, viewModel.passwordError.value)
        assertEquals(null, viewModel.loginState.value)
    }
}
