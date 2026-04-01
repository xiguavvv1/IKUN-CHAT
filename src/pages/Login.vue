<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginUser, resolveLandingPage } from '../services/authService'//Function for logging in

const router = useRouter()//Create a route
const loading = ref(false)//Loading the login button
const errorMessage = ref('')//Error messige

const form = reactive({//Specific login information
  email: '',
  password: ''
})

const submitLogin = async () => {//Run the login function
  errorMessage.value = ''//Clear Messages
  loading.value = true//Loading

  try {
    const { profile } = await loginUser(form)//Backend retrieval of login data
    const landingPage = await resolveLandingPage(profile)//Select the page to redirect to based on the logged-in account
    router.push(landingPage)//Go to page
  } catch (error) {
    errorMessage.value = error.message || 'Login failed. Please check your email and password.'
  } finally {//end
    loading.value = false
  }
}
</script>

<template>
  <div class="screen center-screen"><!-- Overall page data -->
    <div class="auth-panel"> <!-- Login Page -->
      <p class="eyebrow">IKUN CHAT</p><!-- Title -->
      <h2>Log in</h2>
      <p class="subtitle">The username and password are submitted to Firebase Auth for verification. Once verified, the system determines whether access to the page is granted.</p>

      <form class="form-grid" @submit.prevent="submitLogin">
        <label>
          <span>Email</span>
          <input v-model="form.email" type="email" placeholder="Please enter your email address" required />
        </label>

        <label>
          <span>Password</span>
          <input v-model="form.password" type="password" placeholder="Please enter your password" required />
        </label>

        <button class="primary-btn" type="submit" :disabled="loading">
          {{ loading ? 'Log in...' : 'Logged in' }}
        </button>
      </form>

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p><!-- Error message -->

      <div class="switch-link"><!-- Prompt users to register -->
        Don't have an account yet?
        <button class="text-btn" @click="router.push('/register')">Go registration</button>
      </div>
    </div>
  </div>
</template>
