<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { loadCurrentProfile, logoutUser } from '../services/authService'//Methods for importing current user information and logging out
import { db } from '../firebase/config'

import {//Import methods used in Firestore
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'

const router = useRouter()
//page state
const profile = ref(null)//Profile of the currently logged-in user
const users = ref([])
const activeTab = ref('users')//user management is displayed first by default

//chat management state
const selectedUser = ref(null)
const chatMessages = ref([])

// Permission check: Check if the currently logged-in user is an administrator
async function loadProfile() {
  profile.value = await loadCurrentProfile()// First, read the information of the currently logged-in user

  if (profile.value?.role !== 'admin') {// If not an administrator, do not allow access to the backend, directly kick back to the chat page
    router.push('/chat')
  }
}

//Read all users and display them in the user management list.
async function loadUsers() {
  const snapshot = await getDocs(collection(db, 'profiles'))
  users.value = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }))
}

//Switch user permissions: switch between admin and user
async function toggleRole(user) {
  const newRole = user.role === 'admin' ? 'user' : 'admin'
  await updateDoc(doc(db, 'profiles', user.id), { role: newRole })//Update this user document in profiles
  await loadUsers()
}

//Delete user
async function deleteUser(userId) {
  if (userId === profile.value.uid) {// Do not allow the administrator to delete themselves, otherwise the backend will be gone
    alert('Cannot delete yourself')
    return
  }
  //Display a confirmation dialog to prevent accidental clicks
  if (!confirm('Are you sure you want to delete the user?？')) return
  await deleteDoc(doc(db, 'profiles', userId))//elete the user from the database
  await loadUsers()
}

//read all chat history of a user
async function loadUserChats(user) {
  selectedUser.value = user
//Construct the name of the chat collection corresponding to this user
  const chatCollection = collection(db, `ikun_chat_${user.uid}`)
  const snapshot = await getDocs(chatCollection)//Read all documents

  let allMessages = []

  snapshot.forEach(doc => {
    const data = doc.data()
    if (data.messages && data.messages.length) {
      allMessages = allMessages.concat(data.messages)//Concatenate these messages into the total message array
    }
  })

  chatMessages.value = allMessages.sort(// Finally, sort by time
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  )
}

//Logout
async function handleLogout() {
  await logoutUser()
  router.push('/login')
}
//The page automatically checks if the current user is an administrator and retrieves all users as soon as it opens.
onMounted(async () => {
  await loadProfile()
  await loadUsers()
})
</script>

<template>
  <div class="admin-layout"><!-- The outermost layer of the entire backend page -->

    <!-- Left-side menu -->
    <div class="sidebar">
      <h2 class="admin-title">
        <img src="/chicken.png" alt="admin icon" class="admin-icon" />
        <span>Admin</span>
      </h2>

      <button :class="{active: activeTab==='users'}" @click="activeTab='users'">
        User Management
      </button>

      <button :class="{active: activeTab==='chat'}" @click="activeTab='chat'">
        Chat data
      </button>

      <button @click="router.push('/chat')">Return to chat</button>
      <button @click="handleLogout">quit</button>
    </div>

    <!-- Main content area on the right -->
    <div class="main">

      <!-- The top notification bar tells you that you are now in administrator mode -->
      <div class="admin-banner">
        <img src="/chicken2.png" alt="admin icon" class="banner-icon" />
        <span>Administrator mode：{{ profile?.displayName }}</span>
      </div>

      <!-- User Management -->
      <div v-if="activeTab==='users'">
        <h3>User Management</h3>
        <!-- Iterate through all users, displaying one per line -->
        <div v-for="user in users" :key="user.id" class="user-row">
          <span>{{ user.displayName }}（{{ user.role }}）</span><!-- Display username and current permissions -->

          <div>
            <button @click="toggleRole(user)">Switch Permissions</button><!-- Switch permissions for this user -->
            <button class="danger" @click="deleteUser(user.id)">Delete</button><!-- Delete this user -->
          </div>
        </div>
      </div>

      <!-- Chat data page -->
      <div v-if="activeTab==='chat'" class="chat-admin">

        <!-- Left side: User list -->
        <div class="chat-user-list">
          <h3>Select User</h3>
          <!-- Clicking a user loads that user's chat history -->
          <div
              v-for="user in users"
              :key="user.id"
              class="chat-user"
              @click="loadUserChats(user)"
          >
            {{ user.displayName }}
          </div>
        </div>

        <!-- Right side: Chat content -->
        <div class="chat-view">
          <h3>
            Chat history：{{ selectedUser?.displayName || 'Please select user' }}
          </h3>
          <!-- Display empty if there are no messages -->
          <div v-if="!chatMessages.length" class="empty">
            No chat history yet
          </div>
          <!-- Display chat history one by one -->
          <div
              v-for="(msg, index) in chatMessages"
              :key="index"
              class="chat-row"
          >
            <strong>{{ msg.senderName }}</strong>：
            {{ msg.text }}
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
/* The line with the administrator title */
.admin-title {
  margin: 0 0 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #7c3aed;
  font-size: 28px;
  font-weight: 800;
}
/* Top left corner icon */
.admin-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

/* Overall layout of the backend page */
.admin-layout {
  display: flex;
  min-height: 100vh;
  background:
      radial-gradient(circle at top left, rgba(255, 216, 77, 0.22), transparent 26%),
      radial-gradient(circle at bottom right, rgba(168, 85, 247, 0.14), transparent 22%),
      linear-gradient(135deg, #fffdf6 0%, #fff8e7 48%, #fff6fb 100%);
  color: #1f2937;
}

/* Left menu bar */
.sidebar {
  width: 240px;
  padding: 24px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-right: 1px solid rgba(255, 191, 0, 0.16);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
  box-shadow: 8px 0 24px rgba(124, 58, 237, 0.04);
}
/* h2 in the sidebar */
.sidebar h2 {
  margin: 0 0 10px;
  color: #7c3aed;
  font-size: 28px;
  font-weight: 800;
}
/* Default style for the left menu button */
.sidebar button {
  width: 100%;
  text-align: left;
  padding: 14px 16px;
  border-radius: 16px;
  border: 2px solid rgba(168, 85, 247, 0.25);
  background: rgba(255, 255, 255, 0.9);
  color: #7c3aed;
  font-size: 15px;
  font-weight: 800;
  box-shadow: 0 10px 20px rgba(168, 85, 247, 0.06);
}
/* The button changes slightly when the mouse hovers over it */
.sidebar button:hover {
  background: #fdf4ff;
  border-color: rgba(168, 85, 247, 0.48);
  color: #6d28d9;
}
/* Currently selected menu button */
.sidebar button.active {
  color: #3b2a00;
  border-color: rgba(255, 190, 11, 0.45);
  background: linear-gradient(135deg, #ffd84d 0%, #ffbe0b 55%, #ff9f1c 100%);
  box-shadow:
      0 10px 22px rgba(255, 179, 0, 0.16),
      0 4px 0 rgba(255, 255, 255, 0.42) inset;
}

/* Right-hand content area */
.main {
  flex: 1;
  padding: 30px;
  overflow: auto;
}

.main h3 {
  margin: 0 0 16px;
  color: #1f2937;
  font-size: 22px;
  font-weight: 800;
}

/* Top Admin Mode Prompt */
.admin-banner {
  margin-bottom: 22px;
  padding: 14px 18px;
  border-radius: 18px;
  font-weight: 800;
  color: #1f2937;
  background: linear-gradient(
      135deg,
      rgba(255, 216, 77, 0.95) 0%,
      rgba(255, 190, 11, 0.82) 50%,
      rgba(168, 85, 247, 0.18) 100%
  );
  border: 1px solid rgba(255, 191, 0, 0.24);
  box-shadow:
      0 10px 24px rgba(255, 179, 0, 0.10),
      0 6px 18px rgba(168, 85, 247, 0.06);

  display: flex;
  align-items: center;
  gap: 10px;
}

/* Icons in the horizontal bar */
.banner-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  flex-shrink: 0;
}

/* Each row in the user list */
.user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  margin-bottom: 12px;
  border-radius: 18px;
  border: 1px solid rgba(255, 191, 0, 0.12);
  background: rgba(255, 255, 255, 0.74);
  box-shadow:
      0 8px 18px rgba(124, 58, 237, 0.05),
      0 2px 0 rgba(255, 255, 255, 0.6) inset;
}
/* Username section */
.user-row span {
  font-weight: 600;
  color: #374151;
}
/* Button area on the right side of each row */
.user-row > div {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
/* Buttons in the user row */
.user-row button {
  min-width: 110px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 2px solid rgba(168, 85, 247, 0.25);
  background: rgba(255, 255, 255, 0.9);
  color: #7c3aed;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(168, 85, 247, 0.05);
}
/* Hover effect for the user row button */
.user-row button:hover {
  background: #fdf4ff;
  border-color: rgba(168, 85, 247, 0.48);
  color: #6d28d9;
}
/* The delete button is highlighted in a danger color to distinguish it from regular buttons. */
.danger {
  color: #d9485f !important;
  border-color: rgba(217, 72, 95, 0.26) !important;
  background: rgba(255, 255, 255, 0.92) !important;
}

.danger:hover {
  background: #fff5f7 !important;
  border-color: rgba(217, 72, 95, 0.42) !important;
  color: #c7304b !important;
}

/* Chat management area: users on the left, chat on the right */
.chat-admin {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 20px;
  margin-top: 18px;
}

/* Left user list box + right chat box */
.chat-user-list,
.chat-view {
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(255, 191, 0, 0.12);
  background: rgba(255, 255, 255, 0.74);
  box-shadow:
      0 10px 22px rgba(124, 58, 237, 0.05),
      0 2px 0 rgba(255, 255, 255, 0.6) inset;
}


.chat-user-list h3,
.chat-view h3 {
  margin-top: 0;
  margin-bottom: 14px;
}

/* Each user item on the left */
.chat-user {
  padding: 12px 14px;
  margin-bottom: 10px;
  border-radius: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  color: #374151;
  font-weight: 600;
}

/* Effect when the mouse hovers over the user item */
.chat-user:hover {
  border-color: rgba(168, 85, 247, 0.20);
  background: linear-gradient(
      135deg,
      rgba(255, 249, 235, 0.98),
      rgba(253, 244, 255, 0.92)
  );
  box-shadow: 0 8px 18px rgba(168, 85, 247, 0.05);
}

/* Chat history display area */
.chat-view {
  min-height: 420px;
}

/* Each chat message */
.chat-row {
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 191, 0, 0.12);
  color: #1f2937;
  line-height: 1.7;
  word-break: break-word;
}

.chat-row:last-child {
  border-bottom: none;
}

.chat-row strong {
  color: #7c3aed;
  font-weight: 800;
}

/* Empty state displayed when there is no chat history */
.empty {
  margin-top: 12px;
  display: grid;
  place-items: center;
  min-height: 140px;
  border: 1px dashed rgba(168, 85, 247, 0.22);
  border-radius: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.45);
  color: #6b7280;
  font-weight: 600;
}


</style>