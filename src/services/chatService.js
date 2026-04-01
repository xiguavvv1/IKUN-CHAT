import { //Import methods used in Firestore
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore'
import { db } from '../firebase/config'// Firestore database instance

//get the chat collection for a specific user
//Each user has their own chat collection
function userChatCollection(uid) {
  return collection(db, `ikun_chat_${uid}`)
}
//get the chat document between current user and a friend
//document id is the friend's uid
function messageDoc(ownerUid, friendUid) {
  return doc(db, `ikun_chat_${ownerUid}`, friendUid)
}

//search a user by email or display name
export async function searchUser(keyword, currentUid) {

  const trimmed = keyword.trim() //remove extra spaces

  //if input is empty, throw error
  if (!trimmed) {
    throw new Error('Please enter an email or username.')
  }

  const profilesRef = collection(db, 'profiles') //reference to profiles collection

  //try to find user by email
  let profileSnap = await getDocs(
      query(profilesRef, where('email', '==', trimmed), limit(1))
  )

  //if not found by email, try name
  if (profileSnap.empty) {
    profileSnap = await getDocs(
        query(profilesRef, where('displayName', '==', trimmed), limit(1))
    )
  }

  //if still not found, throw error
  if (profileSnap.empty) {
    throw new Error('User not found.')
  }

  //get the first matched user
  const found = profileSnap.docs[0]

  //build user data object with uid
  const data = { uid: found.id, ...found.data() }

  //prevent adding yourself as a friend
  if (data.uid === currentUid) {
    throw new Error('You cannot add yourself.')
  }

  return data //return user info
}

//check whether this chat already exists
//if not, create a new chat record for this friend
export async function ensureFriendChat(ownerProfile, friendProfile) {
  const chatRef = messageDoc(ownerProfile.uid, friendProfile.uid) //locate the chat doc
  const snap = await getDoc(chatRef) //read current chat data

  // return the old chat directly if it is already there
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() }
  }

  //default chat info when starting a new conversation
  const starter = {
    friendUid: friendProfile.uid,          //save friend's uid
    friendEmail: friendProfile.email,      //save friend's email
    friendName: friendProfile.displayName, //save friend's name
    messages: [],                          //messages
    lastMessage: '',                       //no latest message yet
    updatedAt: serverTimestamp()           //record time
  }

  await setDoc(chatRef, starter) //create chat doc in Firestore
  return { id: friendProfile.uid, ...starter } //send back the new chat info
}

//get the current user's contact list
//chats with newer activity will appear first
export async function loadContacts(currentProfile) {
  const snap = await getDocs(userChatCollection(currentProfile.uid)) //read all chat docs

  const contacts = snap.docs
      .map((item) => ({
        id: item.id,   //use doc id as contact id
        ...item.data() //keep the rest of the saved data
      }))
      .sort((a, b) => {
        const aValue = a.updatedAt?.seconds || 0 //avoid undefined timestamp
        const bValue = b.updatedAt?.seconds || 0
        return bValue - aValue //bigger time means more recent
      })

  return contacts
}

//read the message list between current user and a friend
export async function loadMessages(currentProfile, friendUid) {
  const snap = await getDoc(messageDoc(currentProfile.uid, friendUid)) //find this chat doc

  //if no chat record is found, just return an empty array
  if (!snap.exists()) return []

  const data = snap.data()
  return data.messages || [] // return stored messages
}

//send one message and sync it to both sides
export async function sendMessage({ currentProfile, friendProfile, text }) {
  const content = text.trim() //remove spaces at both ends first

  //Block empty input
  if (!content) {
    throw new Error('The message cannot be empty.')
  }

  //Build a message object
  const message = {
    senderUid: currentProfile.uid,          //who sent this message
    senderName: currentProfile.displayName, //sender's name
    text: content,                          //actual message text
    createdAt: new Date().toISOString()     //current time
  }

  const myRef = messageDoc(currentProfile.uid, friendProfile.uid) // my chat doc with this friend
  const friendRef = messageDoc(friendProfile.uid, currentProfile.uid) // friend's chat doc with me

  //Update my own chat preview info first
  await setDoc(
      myRef,
      {
        friendUid: friendProfile.uid,
        friendEmail: friendProfile.email,
        friendName: friendProfile.displayName,
        lastMessage: content,
        updatedAt: serverTimestamp()
      },
      { merge: true } //keep old data and only update these fields
  )

  //update the other person's chat preview info too
  await setDoc(
      friendRef,
      {
        friendUid: currentProfile.uid,
        friendEmail: currentProfile.email,
        friendName: currentProfile.displayName,
        lastMessage: content,
        updatedAt: serverTimestamp()
      },
      { merge: true } //Do not overwrite the whole document.
  )

  //Push this message into my own message list
  await updateDoc(myRef, {
    messages: arrayUnion(message),
    lastMessage: content,
    updatedAt: serverTimestamp()
  })

  //Push the same message into the friend's message list
  await updateDoc(friendRef, {
    messages: arrayUnion(message),
    lastMessage: content,
    updatedAt: serverTimestamp()
  })

  return message
}