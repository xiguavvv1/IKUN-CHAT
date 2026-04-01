<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()   // Create a routing tool to navigate between pages
</script>

<template>
  <div class="screen"> <!--Responsible for the outermost layer, the entire page-->
    <div class="bg-decor decor-left"></div>
    <div class="bg-decor decor-right"></div>

    <div class="auth-panel home-panel"> <!--The area responsible for the card in the middle of the page-->
      <div class="badge">🐔 IKUN ENERGY</div>

      <p class="eyebrow">IKUN CHAT</p> <!--Create an IKUN CHAT title-->

      <h1 class="main-title"> <!--Website main title-->
        Welcome to IKUN CHAT!
      </h1>

      <p class="sub-title">
        Join us and speak your mind!
      </p>

      <div class="hero-actions"> <!--Create Button-->
        <button class="primary-btn" @click="router.push('/login')"> <!--Create a "Log In" button and link it to the login page-->
          Click to log in
        </button>

        <button class="ghost-btn" @click="router.push('/register')"> <!--Create a "Register" button and link it to the registration page-->
          Create an account
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.screen {/* Whole page background design */
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  box-sizing: border-box;
  background:
      radial-gradient(circle at top left, #fff7cc 0%, transparent 32%),/* Light yellow circular gradient halo in the upper left corner */
      radial-gradient(circle at bottom right, #f3d9ff 0%, transparent 28%),/* Light purple circular gradient halo in the bottom right corner */
      linear-gradient(135deg, #fffdf6 0%, #fff8e7 45%, #fff4fb 100%);/* Soft, diagonal gradient background for the entire page */
}


.screen::before {/* Background image layer design */
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/chicken.png');
  background-size: 420px auto;
  background-position: right 6% bottom 8%;
  background-repeat: no-repeat;
  opacity: 0.22;
  filter: saturate(1) contrast(1.02);
  z-index: 0;
  pointer-events: none;
}


.screen::after {/* This is a soft filter layer applied over the background. */
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
      135deg,
      rgba(255, 253, 246, 0.18) 0%,
      rgba(255, 248, 231, 0.10) 45%,
      rgba(255, 244, 251, 0.18) 100%
  );
  z-index: 0;
  pointer-events: none;
}

.bg-decor {/* Decorative glowing circle base style */
  position: absolute;
  border-radius: 50%;
  filter: blur(10px);
  opacity: 0.55;
  z-index: 0;
}

.decor-left {/* Left decorative glow design */
  width: 260px;
  height: 260px;
  left: -60px;
  top: 80px;
  background: radial-gradient(circle, #ffd84d 0%, #ffb300 55%, transparent 75%);
}

.decor-right {/* Right decorative glow design */
  width: 300px;
  height: 300px;
  right: -80px;
  bottom: 60px;
  background: radial-gradient(circle, #d8b4fe 0%, #a855f7 55%, transparent 75%);
}

.auth-panel {/* Main center card design */
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 900px;
  padding: 56px 48px;
  border-radius: 32px;
  text-align: center;
  background: rgba(255, 255, 255, 0.84);
  border: 2px solid rgba(255, 210, 60, 0.35);
  box-shadow:
      0 18px 50px rgba(255, 193, 7, 0.12),
      0 12px 30px rgba(168, 85, 247, 0.10),
      0 2px 0 rgba(255, 255, 255, 0.7) inset;
  backdrop-filter: blur(8px);
}

.badge {/* Top small badge design */
  display: inline-block;
  margin-bottom: 18px;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #7c3aed;
  background: linear-gradient(135deg, #fff1a8, #f5d0fe);
  box-shadow: 0 6px 16px rgba(124, 58, 237, 0.08);
}

.eyebrow {  /* Designing the typographic details of IKUN CHAT */
  margin: 0;
  font-size: 72px;
  font-weight: 900;
  letter-spacing: 6px;
  line-height: 1.05;
  color: #ffbf00;
  text-transform: uppercase;
  text-shadow:
      0 2px 0 #fff,
      0 8px 18px rgba(255, 191, 0, 0.25);
}

.main-title { /* Main welcome title design */
  margin: 22px 0 10px;
  font-size: 46px;
  line-height: 1.2;
  font-weight: 800;
  color: #1f2937;
}

.sub-title {/*description text design */
  margin: 0 auto 34px;
  max-width: 720px;
  font-size: 20px;
  line-height: 1.7;
  font-weight: 500;
  color: #4b5563;
}

.hero-actions {   /* Button group layout design */
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.primary-btn,
.ghost-btn { /* Shared button base design */
  min-width: 230px;
  padding: 16px 26px;
  border-radius: 16px;
  font-size: 19px;
  font-weight: 800;
  cursor: pointer;
  transition:
      transform 0.22s ease,
      box-shadow 0.22s ease,
      background 0.22s ease,
      border-color 0.22s ease,
      color 0.22s ease;
}

.primary-btn {           /* Login Button Design */
  border: none;
  color: #3b2a00;
  background: linear-gradient(135deg, #ffd84d 0%, #ffbe0b 55%, #ff9f1c 100%);
  box-shadow:
      0 10px 24px rgba(255, 179, 0, 0.22),
      0 4px 0 rgba(255, 255, 255, 0.45) inset;
}

.primary-btn:hover {/* Login button hover effect */
  transform: translateY(-3px) scale(1.01);
  box-shadow:
      0 16px 30px rgba(255, 179, 0, 0.28),
      0 4px 0 rgba(255, 255, 255, 0.55) inset;
}

.ghost-btn {     /* Register button design */
  color: #7c3aed;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(168, 85, 247, 0.32);
  box-shadow: 0 10px 20px rgba(168, 85, 247, 0.08);
}

.ghost-btn:hover {/* Register button hover effect */
  transform: translateY(-3px) scale(1.01);
  background: #fdf4ff;
  border-color: rgba(168, 85, 247, 0.55);
  color: #6d28d9;
}

.primary-btn:active,
.ghost-btn:active {/* Button press effect */
  transform: translateY(0);
}

</style>