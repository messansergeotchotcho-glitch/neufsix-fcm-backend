# FCM Backend for Neufsix

Free backend that listens to Firestore and sends push notifications via Firebase Cloud Messaging.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (neufsix-dc96b)
3. Click Settings (gear icon) → Service Accounts
4. Click "Generate New Private Key"
5. A JSON file downloads

### 3. Configure .env

Copy the JSON values to `.env`:

```bash
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=neufsix-dc96b
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY=...  # Important: Keep the \n characters!
FIREBASE_CLIENT_EMAIL=...
FIREBASE_CLIENT_ID=...
FIREBASE_AUTH_URI=...
FIREBASE_TOKEN_URI=...
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=...
FIREBASE_CLIENT_X509_CERT_URL=...
DATABASE_URL=https://neufsix-dc96b.firebaseio.com
```

### 4. Test Locally

```bash
npm start
```

You should see:
```
🔥 Firebase initialized
📡 Starting message listeners...
🚀 Server running on port 3000
📡 Listening to Firestore for new messages...
✅ Ready to send FCM notifications!
```

### 5. Deploy to Render (Free)

- Create GitHub repo and push this code
- Sign up on [Render.com](https://render.com)
- Connect your GitHub repo
- Add environment variables
- Deploy!

## How It Works

1. Backend listens to Firestore `Messages` and `MarketplaceMessages` collections
2. When a new message is added:
   - Gets recipient from conversation
   - Retrieves recipient's FCM token
   - Gets sender's name
   - Sends notification via FCM API
3. Notifications appear on user's phone even when app is closed!

## API Endpoints

- `GET /health` - Health check
- `GET /status` - Status check

## Cost

- Render.com: Free tier ($0/month)
- Firebase: Spark plan ($0/month)
- **Total: $0/month**

## Keep Alive (Optional)

Render free tier spins down after 15 minutes of inactivity.

Use [UptimeRobot](https://uptimerobot.com) to ping `/health` every 5 minutes:

```
https://your-backend.onrender.com/health
```

## Troubleshooting

**No notifications sending?**
- Check Render logs
- Is FCM token saved in Firestore?
- Is backend running?

**Backend keeps going down?**
- Use UptimeRobot to keep alive

**Firebase auth failed?**
- Check FIREBASE_PRIVATE_KEY has all `\n` characters
- Verify all env variables are correct

## Support

Refer to `FREE_SOLUTION_MINI_BACKEND.md` in parent directory for detailed guide.
