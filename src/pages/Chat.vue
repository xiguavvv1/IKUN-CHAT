<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../firebase/config'
import { loadCurrentProfile, logoutUser } from '../services/authService'
import {
  ensureFriendChat,
  loadContacts,
  loadMessages,
  searchUser,
  sendMessage
} from '../services/chatService'

const router = useRouter()

// basic page states
const loading = ref(false)
const sidebarLoading = ref(false)
const errorMessage = ref('')

// input states
const addFriendKeyword = ref('')
const draft = ref('')

// current user and chat data
const currentProfile = ref(null)
const contacts = ref([])
const currentContact = ref(null)
const messages = ref([])

const formState = reactive({
  sending: false,
  addingFriend: false
})

// show current chat title
const currentTitle = computed(() => currentContact.value?.friendName || 'please select a contact')

// check whether current user is admin
const isAdmin = computed(() => currentProfile.value?.role === 'admin')

let pollTimer = null
let polling = false

// reload contact list, and keep the selected friend if possible
async function refreshContacts(selectFriendUid = currentContact.value?.friendUid) {
  if (!currentProfile.value) return

  sidebarLoading.value = true
  try {
    contacts.value = await loadContacts(currentProfile.value)

    if (selectFriendUid) {
      const found = contacts.value.find(
          (item) => item.friendUid === selectFriendUid || item.id === selectFriendUid
      )
      if (found) {
        await selectContact(found)
      }
    }
  } catch (error) {
    errorMessage.value = error.message || 'Failed to load contacts.'
  } finally {
    sidebarLoading.value = false
  }
}

// poll latest chat data every second
async function pollChatData() {
  if (!currentProfile.value || polling) return

  polling = true

  try {
    const latestContacts = await loadContacts(currentProfile.value)
    contacts.value = latestContacts

    const activeUid = currentContact.value?.friendUid || currentContact.value?.id
    if (activeUid) {
      const latestCurrentContact = latestContacts.find(
          (item) => (item.friendUid || item.id) === activeUid
      )

      if (latestCurrentContact) {
        currentContact.value = latestCurrentContact
      }

      messages.value = await loadMessages(currentProfile.value, activeUid)
    }
  } catch (error) {
    console.error('Failed to poll chat data:', error)
  } finally {
    polling = false
  }
}

// load user info and first contact when page opens
async function bootstrapPage() {
  loading.value = true
  errorMessage.value = ''

  try {
    currentProfile.value = await loadCurrentProfile()

    // if user is not logged in, go back to login page
    if (!currentProfile.value) {
      router.push('/login')
      return
    }

    await refreshContacts()

    // auto select the first contact
    if (contacts.value.length) {
      await selectContact(contacts.value[0])
    }
  } catch (error) {
    errorMessage.value = error.message || 'Failed to initialise the chat page.'
  } finally {
    loading.value = false
  }
}

// switch to another contact and load messages
async function selectContact(contact) {
  currentContact.value = contact
  messages.value = await loadMessages(
      currentProfile.value,
      contact.friendUid || contact.id
  )
}

// search and add a friend
async function addFriend() {
  if (!addFriendKeyword.value.trim()) return

  formState.addingFriend = true
  errorMessage.value = ''

  try {
    const friendProfile = await searchUser(addFriendKeyword.value, currentProfile.value.uid)

    // create chat records for both sides
    await ensureFriendChat(currentProfile.value, friendProfile)
    await ensureFriendChat(friendProfile, currentProfile.value)

    addFriendKeyword.value = ''
    await refreshContacts(friendProfile.uid)
  } catch (error) {
    errorMessage.value = error.message || '添加好友失败。'
  } finally {
    formState.addingFriend = false
  }
}

// send current message
async function submitMessage() {
  if (!currentContact.value || !draft.value.trim()) return

  formState.sending = true
  errorMessage.value = ''

  try {
    await sendMessage({
      currentProfile: currentProfile.value,
      friendProfile: {
        uid: currentContact.value.friendUid || currentContact.value.id,
        email: currentContact.value.friendEmail,
        displayName: currentContact.value.friendName
      },
      text: draft.value
    })

    draft.value = ''

    // reload messages and contact list after sending
    messages.value = await loadMessages(
        currentProfile.value,
        currentContact.value.friendUid || currentContact.value.id
    )
    await refreshContacts(currentContact.value.friendUid || currentContact.value.id)
  } catch (error) {
    errorMessage.value = error.message || 'Failed to send message.'
  } finally {
    formState.sending = false
  }
}

// go to admin page
function goAdmin() {
  router.push('/admin')
}

// logout and go back to login page
async function handleLogout() {
  await logoutUser()
  router.push('/login')
}

onMounted(async () => {
  await bootstrapPage()

  // start polling when page is mounted
  pollTimer = setInterval(() => {
    pollChatData()
  }, 1000)
})

onUnmounted(() => {
  // clear timer when leaving page
  if (pollTimer) {
    clearInterval(pollTimer)
  }
})
</script>

<template>
  <div class="chat-screen">
    <aside class="sidebar-panel">
      <div class="sidebar-top">
        <div>
          <p class="eyebrow">IKUN CHAT</p >
          <h2>{{ currentProfile?.displayName || 'Loading...' }}</h2>
          <p class="muted-line">{{ currentProfile?.email }}</p >
          <p class="role-line">
            Current status:
            <span :class="isAdmin ? 'role-admin' : 'role-user'">
              {{ currentProfile?.role || 'unknown' }}
            </span>
          </p >
        </div>

        <div class="top-actions">
          <button
              v-if="isAdmin"
              class="primary-btn admin-back-btn"
              @click="goAdmin"
          >
            <img src="/chicken.png" alt="admin icon" class="admin-back-icon" />
            <span>Admin dashboard</span>
          </button>

          <button class="text-btn danger-btn" @click="handleLogout">Logout</button>
        </div>
      </div>

      <!-- friend search area -->
      <div class="friend-search">
        <input
            v-model="addFriendKeyword"
            placeholder="Enter your friend's email address or nickname"
            @keyup.enter="addFriend"
        />
        <button
            class="primary-btn"
            :disabled="formState.addingFriend"
            @click="addFriend"
        >
          {{ formState.addingFriend ? 'Adding...' : 'Add Friend' }}
        </button>
      </div>

      <div class="list-title">Contact</div>
      <div v-if="sidebarLoading" class="empty-box">Loading contacts...</div>

      <!-- contact list -->
      <div v-else class="contact-list">
        <button
            v-for="contact in contacts"
            :key="contact.id"
            class="contact-card"
            :class="{ active: (currentContact?.friendUid || currentContact?.id) === (contact.friendUid || contact.id) }"
            @click="selectContact(contact)"
        >
          <div class="contact-avatar">
            {{ (contact.friendName || '?').slice(0, 1).toUpperCase() }}
          </div>
          <div class="contact-body">
            <div class="contact-name">{{ contact.friendName || 'Unnamed Friend' }}</div>
            <div class="contact-preview">{{ contact.lastMessage || 'No chat history yet' }}</div>
          </div>
        </button>

        <div v-if="!contacts.length" class="empty-box">
          You don’t have any friends yet. Why not search for and add one?
        </div>
      </div>
    </aside>

    <main class="chat-panel">
      <header class="chat-header">
        <div>
          <p class="eyebrow">Current Session</p >
          <h2>{{ currentTitle }}</h2>
        </div>

        <div v-if="isAdmin" class="chat-admin-badge">
          Admin Mode
        </div>
      </header>

      <!-- page loading state -->
      <section v-if="loading" class="messages-panel empty-box">
        Page initializing...
      </section>

      <!-- no contact selected -->
      <section v-else-if="!currentContact" class="messages-panel empty-box">
        Select a contact from the sidebar to start chatting.
      </section>

      <!-- message area -->
      <section v-else class="messages-panel">
        <div
            v-for="(msg, index) in messages"
            :key="`${msg.createdAt}-${index}`"
            class="message-row"
            :class="msg.senderUid === auth.currentUser?.uid ? 'mine' : 'other'"
        >
          <div class="message-bubble">
            <div class="message-author">{{ msg.senderName }}</div>
            <div>{{ msg.text }}</div>
          </div>
        </div>
      </section>

      <!-- message input area -->
      <footer class="composer">
        <input
            v-model="draft"
            placeholder="Type a message, press Enter to send"
            :disabled="!currentContact"
            @keyup.enter="submitMessage"
        />
        <button
            class="primary-btn"
            :disabled="formState.sending || !currentContact"
            @click="submitMessage"
        >
          {{ formState.sending ? 'Sending...' : 'Send' }}
        </button>
      </footer>

      <p v-if="errorMessage" class="error-text page-error">{{ errorMessage }}</p >
    </main>
  </div>
</template>

<style scoped>
.chat-screen {
  grid-template-columns: 340px 1fr;
}

.sidebar-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sidebar-top > div:first-child {
  min-width: 0;
}

.sidebar-top h2,
.chat-header h2 {
  margin: 0;
}

.role-line {
  margin: 8px 0 0;
  font-size: 14px;
  color: #6b7280;
}

.role-admin {
  color: #ffbf00;
  font-weight: 800;
}

.role-user {
  color: #7c3aed;
  font-weight: 800;
}

.top-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 168px;
}

.admin-back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.admin-back-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.friend-search {
  display: flex;
  align-items: stretch;
}

.friend-search .primary-btn {
  white-space: nowrap;
}

.contact-list {
  overflow-y: auto;
  min-height: 0;
}

.contact-body {
  flex: 1;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.chat-admin-badge {
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  color: #7c3aed;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(168, 85, 247, 0.22);
  box-shadow: 0 8px 18px rgba(168, 85, 247, 0.06);
}

.messages-panel {
  min-height: 0;
}
</style>