<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
// Create a routing utility for page navigation
import { registerUser, resolveLandingPage } from '../services/authService'// Import `registerUser` and `resolveLandingPage` from the server

const router = useRouter()// Create a route instance, then navigate to the page
const loading = ref(false)// Create a “loading” state; if the default value is false, it means the registration has not been submitted
// If the user clicks the “Register” button, the state will change to true, and the button text will also update
const errorMessage = ref('')// Create a message to display if there is an input error.

const form = reactive({//Create an object to store the information entered by the user
  displayName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const submitRegister = async () => {// This function is triggered when the user clicks the “Register” button or submits the form
  errorMessage.value = ''//Clear the previous data before each user registration

  if (form.password !== form.confirmPassword) {
    errorMessage.value = 'The two passwords do not match!'// Check if the two passwords entered match. If they do not, display an error message and stop the registration process.
    return
  }

  loading.value = true// When registration begins, set `loading` to `true` so that the page displays “Registering...” and the button is disabled


  try {
    const { profile } = await registerUser(form)// Call `registerUser` and pass the entire form object to it; upon successful registration, it will return the user's information and profile
    const landingPage = await resolveLandingPage(profile)// Determine which page to redirect to based on the logged-in user; regular users go to the regular user interface, and administrators go to the administrator interface
    router.push(landingPage)//Redirect to the page displayed after successful registration
  } catch (error) {// If registration fails, display an error message; if the system returns a specific error, display that error; otherwise, display the default message
    errorMessage.value = error.message || 'Registration failed. Please try again later.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="screen center-screen">
    <div class="auth-panel">
      <p class="eyebrow">IKUN CHAT</p>
      <h2>Create an account</h2>
      <p class="subtitle">Registration information will first be processed by Firebase Auth and then written to the user profile table for subsequent page permissions and chat identity verification.</p>

      <form class="form-grid" @submit.prevent="submitRegister">
        <!-- Enter a name -->
        <label>
          <span>Name</span>
          <input v-model="form.displayName" type="text" placeholder="Please enter a name" required />
        </label>
        <!-- Email input field -->
        <label>
          <span>email</span>
          <input v-model="form.email" type="email" placeholder="Please enter your email address" required />
        </label>
        <!-- Password entry screen -->
        <label>
          <span>Password</span>
          <input v-model="form.password" type="password" placeholder="Please enter your password" required />
        </label>
        <!-- Password Confirmation Screen -->
        <label>
          <span>Confirm password</span>
          <input v-model="form.confirmPassword" type="password" placeholder="Please enter your password again." required />
        </label>

        <button class="primary-btn" type="submit" :disabled="loading"><!-- Sign Up Button -->
          {{ loading ? 'Registering...' : 'Sign Up' }}
        </button>
      </form>

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <div class="switch-link">
        Already have an account?
        <button class="text-btn" @click="router.push('/login')">Go to Log in</button>
      </div>
    </div>
  </div>
</template>
