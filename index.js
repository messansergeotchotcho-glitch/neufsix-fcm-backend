const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.warn('⚠️  Cloudinary not configured (CLOUDINARY_CLOUD_NAME missing)');
}

// Initialize Firebase Admin with service account
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');

let serviceAccount;
let db = null;
let firebaseInitialized = false;

try {
  // Load from JSON file (most reliable)
  serviceAccount = require(serviceAccountPath);
  console.log('✅ Service account loaded from JSON file');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL || 'https://neufsix-dc96b.firebaseio.com'
  });
  
  db = admin.firestore();
  firebaseInitialized = true;
  console.log('🔥 Firebase initialized');
} catch (error) {
  console.warn('⚠️  Firebase service account not available - running in Cloudinary-only mode');
  console.warn(`   Reason: ${error.message}`);
  console.log('💡 This is OK - backend can still delete images from Cloudinary!');
}

const app = express();
app.use(cors());
app.use(express.json());

console.log('🔥 Firebase initialized');
console.log('📡 Starting message listeners...');

// Listen to Messages collection (only if Firebase is initialized)
if (firebaseInitialized && db) {
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
} else {
  console.log('⏭️  Skipping Firebase message listeners - running in Cloudinary-only mode');
}// Send FCM notification
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

// ✅ Helper: Extract publicId from Cloudinary URL
function extractPublicIdFromUrl(url) {
  try {
    console.log(`\n🔍 Extracting publicId from URL: ${url}`);
    
    // URL format: https://res.cloudinary.com/dgsrr8tif/image/upload/v1234567890/public_id.jpg
    // or: https://res.cloudinary.com/dgsrr8tif/image/upload/public_id.jpg
    
    const urlObj = new URL(url);
    console.log(`   Hostname: ${urlObj.hostname}`);
    console.log(`   Pathname: ${urlObj.pathname}`);
    
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    console.log(`   Path parts: ${JSON.stringify(pathParts)}`);
    
    // Find 'upload' index
    const uploadIndex = pathParts.indexOf('upload');
    console.log(`   Upload index: ${uploadIndex}`);
    
    if (uploadIndex === -1) {
      console.error('❌ "upload" not found in URL:', url);
      return null;
    }
    
    // Get everything after 'upload'
    let afterUpload = pathParts.slice(uploadIndex + 1).join('/');
    console.log(`   After upload: ${afterUpload}`);
    
    // Remove file extension
    if (afterUpload.includes('.')) {
      afterUpload = afterUpload.substring(0, afterUpload.lastIndexOf('.'));
    }
    console.log(`   Without extension: ${afterUpload}`);
    
    // Split by / to handle versions
    const segments = afterUpload.split('/');
    console.log(`   Segments: ${JSON.stringify(segments)}`);
    
    // If first segment is a version (v123456), skip it
    let publicId = afterUpload;
    if (segments.length > 0 && segments[0].startsWith('v') && /^\d+$/.test(segments[0].substring(1))) {
      // It's a version! Skip it
      publicId = segments.slice(1).join('/');
      console.log(`   ⏭️ Skipping version: ${segments[0]}`);
    }
    
    console.log(`✅ Final publicId: ${publicId}`);
    return publicId;
  } catch (error) {
    console.error('❌ Error extracting publicId:', error);
    return null;
  }
}

// ✅ DELETE IMAGE FROM CLOUDINARY ENDPOINT
app.post('/delete-image', async (req, res) => {
  try {
    console.log(`\n📨 POST /delete-image received`);
    console.log(`   Body: ${JSON.stringify(req.body)}`);
    
    let { publicId, imageUrl } = req.body;
    
    // Si pas de publicId, essayer d'extraire de l'URL
    if (!publicId && imageUrl) {
      console.log(`📍 No publicId provided, extracting from URL...`);
      publicId = extractPublicIdFromUrl(imageUrl);
    }
    
    if (!publicId) {
      console.error(`❌ No publicId extracted`);
      return res.status(400).json({ 
        success: false, 
        error: 'publicId or imageUrl is required',
        received: { publicId, imageUrl }
      });
    }
    
    console.log(`🗑️  Deleting from Cloudinary: ${publicId}`);
    console.log(`   Cloud name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY ? 'SET ✓' : 'NOT SET ✗'}`);
    console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET ? 'SET ✓' : 'NOT SET ✗'}`);
    
    // ✅ Delete image from Cloudinary
    // IMPORTANT: use 'image' not 'auto' - 'auto' is not valid!
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image'  // ✅ FIXED: was 'auto', must be 'image'
    });
    
    console.log(`✅ Cloudinary response: ${JSON.stringify(result)}`);
    
    return res.json({
      success: true,
      message: `Image ${publicId} deleted`,
      result: result.result
    });
    
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ CLEANUP EXPIRED STORIES ENDPOINT
app.post('/cleanup-expired-stories', async (req, res) => {
  try {
    console.log(`\n🧹 POST /cleanup-expired-stories received`);
    
    if (!firebaseInitialized || !db) {
      return res.status(503).json({
        success: false,
        error: 'Firebase not initialized'
      });
    }
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    console.log(`   Current time: ${now.toISOString()}`);
    console.log(`   24h ago: ${twentyFourHoursAgo.toISOString()}`);
    
    // ✅ Récupérer les stories de plus de 24h
    const expiredSnapshot = await db.collection('stories')
      .where('createdAt', '<', twentyFourHoursAgo)
      .get();
    
    console.log(`   Found ${expiredSnapshot.size} expired stories`);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    // ✅ Supprimer chaque story expirée
    for (const doc of expiredSnapshot.docs) {
      try {
        const storyData = doc.data();
        const storyId = doc.id;
        
        console.log(`   📝 Processing story: ${storyId}`);
        
        // Supprimer les images/vidéos de Cloudinary
        if (storyData.imageUrl) {
          console.log(`      - Deleting image: ${storyData.imageUrl.substring(0, 50)}...`);
          const imagePublicId = extractPublicIdFromUrl(storyData.imageUrl);
          if (imagePublicId) {
            await cloudinary.uploader.destroy(imagePublicId, {
              resource_type: 'image'
            });
            console.log(`      ✅ Image deleted`);
          }
        }
        
        if (storyData.videoUrl) {
          console.log(`      - Deleting video: ${storyData.videoUrl.substring(0, 50)}...`);
          const videoPublicId = extractPublicIdFromUrl(storyData.videoUrl);
          if (videoPublicId) {
            await cloudinary.uploader.destroy(videoPublicId, {
              resource_type: 'video'
            });
            console.log(`      ✅ Video deleted`);
          }
        }
        
        // Supprimer la story de Firestore
        await db.collection('stories').doc(storyId).delete();
        console.log(`      ✅ Story deleted from Firestore`);
        deletedCount++;
      } catch (error) {
        console.error(`      ❌ Error deleting story: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Cleanup complete: ${deletedCount} deleted, ${errorCount} errors`);
    
    return res.json({
      success: true,
      message: `Deleted ${deletedCount} expired stories`,
      deleted: deletedCount,
      errors: errorCount
    });
    
  } catch (error) {
    console.error('❌ Error in cleanup:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Upload category image endpoint
app.post('/upload-category-image', async (req, res) => {
  try {
    const { category, imageBase64 } = req.body;
    
    if (!category || !imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'category and imageBase64 are required'
      });
    }
    
    if (!firebaseInitialized || !db) {
      return res.status(503).json({
        success: false,
        error: 'Firebase not initialized'
      });
    }
    
    console.log(`\n📸 Uploading category image: ${category}`);
    console.log(`   Base64 size: ${(imageBase64.length / 1024).toFixed(2)} KB`);
    
    // Upload to Firestore
    await db.collection('categoryImages').doc(category).set({
      imageBase64: imageBase64,
      updatedAt: new Date(),
    }, { merge: true });
    
    console.log(`✅ Image ${category} updated in Firestore`);
    
    res.json({
      success: true,
      message: `Category image ${category} uploaded successfully`,
      category: category,
      size: imageBase64.length
    });
    
  } catch (error) {
    console.error('❌ Error uploading category image:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
  if (firebaseInitialized) {
    console.log(`📡 Listening to Firestore for new messages...`);
    console.log(`✅ Ready to send FCM notifications!`);
  } else {
    console.log(`📡 Running in Cloudinary-only mode`);
    console.log(`✅ Ready to delete images from Cloudinary!`);
  }
  console.log(`🎯 POST /delete-image endpoint available`);
});
