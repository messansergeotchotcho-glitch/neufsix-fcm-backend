const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin with service account
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');

let serviceAccount;
try {
  // Load from JSON file (most reliable)
  serviceAccount = require(serviceAccountPath);
  console.log('✅ Service account loaded from JSON file');
} catch (error) {
  console.error('❌ Error loading service account:', error.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL || 'https://neufsix-dc96b.firebaseio.com'
});

const app = express();
app.use(cors());
app.use(express.json());

const db = admin.firestore();

console.log('🔥 Firebase initialized');
console.log('📡 Starting message listeners...');

// Listen to Messages collection
db.collection('Messages').onSnapshot(
  async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      if (change.type === 'added') {
        const message = change.doc.data();
        console.log(`📨 New message detected: "${message.text?.substring(0, 30)}..."`);
        
        try {
          await sendFCMNotification(
            message.conversationId,
            message.senderId,
            message.text
          );
        } catch (error) {
          console.error('❌ Error processing message:', error);
        }
      }
    }
  },
  (error) => {
    console.error('❌ Error listening to Messages:', error);
  }
);

// Listen to MarketplaceMessages collection
db.collection('MarketplaceMessages').onSnapshot(
  async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      if (change.type === 'added') {
        const message = change.doc.data();
        console.log(`📦 New marketplace message detected: "${message.text?.substring(0, 30)}..."`);
        
        try {
          await sendFCMNotification(
            message.conversationId,
            message.senderId,
            message.text
          );
        } catch (error) {
          console.error('❌ Error processing marketplace message:', error);
        }
      }
    }
  },
  (error) => {
    console.error('❌ Error listening to MarketplaceMessages:', error);
  }
);

// Send FCM notification
async function sendFCMNotification(conversationId, senderId, messageText) {
  try {
    console.log(`\n🔄 Processing notification for conversation: ${conversationId}`);
    
    // Get conversation to find recipient
    const convoDoc = await db.collection('Conversations').doc(conversationId).get();
    if (!convoDoc.exists) {
      console.log(`⚠️ Conversation not found: ${conversationId}`);
      return;
    }
    
    const conversation = convoDoc.data();
    console.log(`✅ Conversation found`);
    
    // Determine recipient (the other user)
    const recipientId = conversation.userId1 === senderId ? conversation.userId2 : conversation.userId1;
    console.log(`👤 Recipient ID: ${recipientId}`);
    
    // Get recipient FCM token
    const recipientDoc = await db.collection('users').doc(recipientId).get();
    if (!recipientDoc.exists) {
      console.log(`⚠️ Recipient user not found: ${recipientId}`);
      return;
    }
    
    const recipientToken = recipientDoc.data().fcmToken;
    if (!recipientToken) {
      console.log(`⚠️ No FCM token for recipient: ${recipientId}`);
      return;
    }
    
    console.log(`✅ FCM token found (${recipientToken.substring(0, 20)}...)`);
    
    // Get sender info
    const senderDoc = await db.collection('users').doc(senderId).get();
    const senderName = senderDoc.data()?.nom || 'Un utilisateur';
    console.log(`✅ Sender name: ${senderName}`);
    
    // Truncate message for notification
    const bodyPreview = messageText.length > 100
      ? messageText.substring(0, 100) + '...'
      : messageText;
    
    // Send via FCM
    console.log(`📤 Sending FCM notification...`);
    const response = await admin.messaging().send({
      token: recipientToken,
      notification: {
        title: senderName,
        body: bodyPreview,
      },
      data: {
        type: 'message',
        conversationId: conversationId,
        senderName: senderName,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        ttl: 3600,
        priority: 'high',
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
      },
    });
    
    console.log(`✅ FCM notification sent successfully!`);
    console.log(`   Title: "${senderName}"`);
    console.log(`   Body: "${bodyPreview}"`);
    console.log(`   Message ID: ${response}\n`);
    
  } catch (error) {
    console.error('❌ Error in sendFCMNotification:', error);
    console.error('Stack:', error.stack);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'listening',
    collections: ['Messages', 'MarketplaceMessages'],
    timestamp: new Date(),
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Listening to Firestore for new messages...`);
  console.log(`✅ Ready to send FCM notifications!`);
});
