<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="screen center-screen"><!-- The outermost container of the entire page (centered) -->
    <div class="auth-panel">
      <p class="eyebrow">403</p><!-- Error code (403 = No permission) -->
      <h2>You do not have permission to access this page.</h2>
      <p class="subtitle">
        This route has been blocked. Please first confirm that you are logged in and that your profile.role meets the page requirements.
      </p>

      <div class="hero-actions">
        <button class="primary-btn" @click="router.push('/chat')">Go to the chat screen</button>
        <button class="ghost-btn" @click="router.push('/')">Back to Home</button>
      </div>
    </div>
  </div>
</template>
