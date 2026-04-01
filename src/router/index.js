import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Login from '../pages/Login.vue'
import Register from '../pages/Register.vue'
import Chat from '../pages/Chat.vue'
import Admin from '../pages/Admin.vue'
import NotAuthorized from '../pages/NotAuthorized.vue'
import { auth } from '../firebase/config'
import { loadCurrentProfile, resolveLandingPage, waitForAuthReady } from '../services/authService'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/login', name: 'login', component: Login, meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: Register, meta: { guestOnly: true } },
  { path: '/chat', name: 'chat', component: Chat, meta: { requiresAuth: true } },
  { path: '/admin', name: 'admin', component: Admin, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/403', name: '403', component: NotAuthorized },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  await waitForAuthReady()
  const user = auth.currentUser

  if (to.meta?.requiresAuth && !user) {
    return '/login'
  }

  if (to.meta?.guestOnly && user) {
    const profile = await loadCurrentProfile()
    return resolveLandingPage(profile)
  }

  if (to.meta?.roles?.length) {
    const profile = await loadCurrentProfile()
    if (!profile || !to.meta.roles.includes(profile.role)) {
      return '/403'
    }
  }

  return true
})

export default router
