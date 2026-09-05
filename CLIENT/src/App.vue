<script setup>
import { ref, onMounted, nextTick } from 'vue';
import axios from 'axios';
import { 
  MessageSquare, 
  MoreVertical, 
  Search, 
  Paperclip, 
  Smile, 
  Mic, 
  Send,
  RefreshCw
} from 'lucide-vue-next';

const messages = ref([]);
const newMessage = ref('');
const messageContainer = ref(null);

const API_URL = import.meta.env.VITE_API_URL || '/api';

// --- Session Management ---
const getOrGenerateSessionID = () => {
  let id = localStorage.getItem('whatsapp_session_id');
  if (!id) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    id = '';
    for (let i = 0; i < 9; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    localStorage.setItem('whatsapp_session_id', id);
  }
  return id;
};

const currentSessionID = ref(getOrGenerateSessionID());
// --------------------------

const fetchMessages = async () => {
  try {
    const response = await axios.get(`${API_URL}/messages`);
    const serverMessages = response.data;
    if (!Array.isArray(serverMessages)) return;
    
    // Logic to prevent optimistic messages from disappearing:
    // Only update if:
    // 1. The server has MORE messages than we have locally.
    // 2. OR the server has the SAME amount but the content of the last one is different (it became an incoming message).
    // 3. AND never clear the list if the server returns 0 but we have local messages pending.
    
    const lastLocal = messages.value[messages.value.length - 1];
    const lastServer = serverMessages[serverMessages.length - 1];

    const hasNewContent = lastLocal && lastServer && lastLocal.text !== lastServer.text;
    const serverHasMore = serverMessages.length > messages.value.length;
    const serverHasSameButDiff = (serverMessages.length === messages.value.length) && hasNewContent;

    if (serverHasMore || serverHasSameButDiff || (messages.value.length === 0 && serverMessages.length > 0)) {
      messages.value = serverMessages;
      scrollToBottom();
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
  }
};

const sendMessage = async () => {
  if (!newMessage.value.trim()) return;

  const text = newMessage.value;
  const tempId = Date.now(); // Temporary ID for immediate UI feedback
  
  // Add to UI immediately for better UX
  const localMsg = {
    id: tempId,
    sender: 'Me',
    text,
    timestamp: new Date(),
    incoming: false
  };
  
  messages.value.push(localMsg);
  newMessage.value = '';
  scrollToBottom();

  try {
    await axios.post(`${API_URL}/messages`, { 
      text, 
      SessionID: currentSessionID.value 
    });
    // The next fetchMessages will sync the actual server ID
  } catch (error) {
    console.error('Error sending message:', error);
    // Remove the message if it failed to send
    messages.value = messages.value.filter(m => m.id !== tempId);
    alert('Error al enviar mensaje. Verifica la conexión con el servidor.');
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
};

const resetChat = async () => {
  if (confirm('¿Estás seguro de que quieres reiniciar el chat y generar un nuevo SessionID?')) {
    try {
      await axios.post(`${API_URL}/reset`);
      localStorage.removeItem('whatsapp_session_id');
      window.location.reload();
    } catch (error) {
      console.error('Error al reiniciar el chat:', error);
    }
  }
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatMessage = (text) => {
  if (!text) return '';
  // Reemplaza " - " con un salto de línea seguido de "- " para que se muestre como lista
  return text.replace(/ - /g, '\n- ');
};

onMounted(() => {
  fetchMessages();
  // Poll for new messages every 3 seconds (simple for tests)
  setInterval(fetchMessages, 3000);
});
</script>

<template>
  <div class="whatsapp-app">
    <!-- Sidebar -->
    <div class="sidebar">
      <header class="sidebar-header">
        <div class="avatar">R</div>
        <div class="actions">
          <MessageSquare class="icon" />
          <MoreVertical class="icon" />
        </div>
      </header>
      
      <div class="search-container">
        <div class="search-bar">
          <Search class="icon-small" />
          <input type="text" placeholder="Buscar o empezar un chat nuevo" />
        </div>
      </div>
      
      <div class="chat-list">
        <div class="chat-item active">
          <div class="avatar profile-pic"></div>
          <div class="chat-info">
            <div class="chat-name">Notaría Pruebas</div>
            <div class="chat-last-msg">
              <span v-if="messages.length > 0">
                {{ messages[messages.length - 1].text }}
              </span>
              <span v-else>No hay mensajes</span>
            </div>
          </div>
        </div>
        
        <!-- Placeholder chats -->
        <div class="chat-item" v-for="i in 5" :key="i">
          <div class="avatar" :style="{ background: `hsl(${i * 60}, 70%, 40%)` }">{{ String.fromCharCode(65 + i) }}</div>
          <div class="chat-info">
            <div class="chat-name">Contacto {{ i }}</div>
            <div class="chat-last-msg">Último mensaje del contacto...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Chat Window -->
    <div class="main-chat">
      <header class="chat-header">
        <div class="avatar profile-pic"></div>
        <div class="contact-info">
          <div class="name">Notaría Pruebas</div>
          <div class="status">en línea</div>
        </div>
        <div class="actions">
          <RefreshCw class="icon" @click="resetChat" title="Reiniciar chat y sesión" />
          <Paperclip class="icon" />
          <MoreVertical class="icon" />
        </div>
      </header>

      <div class="message-container" ref="messageContainer">
        <div 
          v-for="msg in messages" 
          :key="msg.id" 
          :class="['message-bubble', msg.incoming ? 'incoming' : 'outgoing']"
        >
          <div class="message-text">{{ formatMessage(msg.text) }}</div>
          <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
        </div>
      </div>

      <footer class="chat-footer">
        <Smile class="icon" />
        <input 
          v-model="newMessage" 
          @keyup.enter="sendMessage" 
          type="text" 
          placeholder="Escribe un mensaje aquí" 
        />
        <Send 
          v-if="newMessage.trim()" 
          @click="sendMessage" 
          class="icon" 
          style="color: #00a884" 
        />
        <Mic v-else class="icon" />
      </footer>
    </div>
  </div>
</template>

<style>
/* Style is in style.css, but App.vue might need some local overrides or we just import it in main.js */
</style>
