# 🚀 Déploiement sur Render (Gratuit!)

## Étape 1: Créer un compte GitHub

Votre dépôt Git est **prêt localement** dans `c:\neufsix_work\fcm-backend\`.

Mais il doit être **poussé sur GitHub** pour que Render puisse le récupérer.

### 1.1 Créer un dépôt GitHub

1. Allez sur **https://github.com/new**
2. Nom du dépôt: `fcm-backend`
3. Description: `FCM notification backend for Neufsix`
4. Sélectionnez **Public** (Render a besoin d'accéder)
5. Cliquez **Create repository**

Vous obtiendrez une URL comme: `https://github.com/YOUR_USERNAME/fcm-backend.git`

### 1.2 Pousser le code sur GitHub

Dans PowerShell:

```powershell
cd c:\neufsix_work\fcm-backend
git remote add origin https://github.com/YOUR_USERNAME/fcm-backend.git
git branch -M main
git push -u origin main
```

Remplacez `YOUR_USERNAME` par votre username GitHub!

---

## Étape 2: Créer un compte Render

1. Allez sur **https://render.com**
2. Cliquez **Sign Up**
3. Choisissez **Sign up with GitHub** (plus facile)
4. Autorisez Render à accéder à votre GitHub

---

## Étape 3: Créer le Web Service

1. Dans Render, cliquez **New +**
2. Sélectionnez **Web Service**
3. Cliquez **Connect a repository**
4. Trouvez et sélectionnez `fcm-backend`
5. Cliquez **Connect**

---

## Étape 4: Configurer le Web Service

### Paramètres de base:

- **Name**: `fcm-backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node index.js`
- **Instance Type**: `Free`

### Ajouter les variables d'environnement:

Cliquez sur **Environment** et ajoutez chaque variable de votre `.env`:

```
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=neufsix-dc96b
FIREBASE_PRIVATE_KEY_ID=b19dba880ea969796125296eb09665bc85b600cd
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCjX23ZJmS4uEnh\n...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@neufsix-dc96b.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=103838801225946236742
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40neufsix-dc96b.iam.gserviceaccount.com
DATABASE_URL=https://neufsix-dc96b.firebaseio.com
PORT=3000
```

**IMPORTANT**: Pour `FIREBASE_PRIVATE_KEY`, assurez-vous que tous les `\n` sont inclus exactement comme dans le fichier `.env`!

---

## Étape 5: Déployer!

Cliquez **Create Web Service**

Render va:
1. Clone votre repo
2. Install les dépendances
3. Démarrer le serveur
4. Vous donner une URL comme: `https://fcm-backend-xxxx.onrender.com`

---

## Étape 6: Vérifier que ça marche

Attendez 2-3 minutes, puis allez à:

```
https://fcm-backend-xxxx.onrender.com/health
```

Vous devriez voir:
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T...",
  "uptime": 123
}
```

Si vous voyez une erreur, vérifiez les **Logs** dans Render (onglet Logs en haut).

---

## Étape 7: Garder le backend actif

Le tier gratuit de Render peut s'endormir après 15 minutes d'inactivité.

Pour le garder actif, utilisez **UptimeRobot** (gratuit):

1. Allez sur **https://uptimerobot.com**
2. Créez un compte (ou connectez-vous)
3. Cliquez **Add New Monitor**
4. Sélectionnez **HTTP(s)**
5. URL: `https://votre-backend.onrender.com/health`
6. Check every: **5 minutes**
7. Cliquez **Create Monitor**

Maintenant le backend sera toujours actif! ✅

---

## Dépannage

### "Build failed"
- Vérifiez que `npm install` fonctionne localement
- Vérifiez que `package.json` a toutes les dépendances

### "Service crashed"
- Allez aux **Logs** et cherchez les erreurs
- Vérifiez que les variables d'environnement sont correctes
- Vérifiez que `firebase-service-account.json` n'existe pas dans le repo (doit être dans `.gitignore`)

### "No notifications sending"
- Vérifiez que le backend reçoit les messages (cherchez "New message detected" dans les logs)
- Vérifiez que les FCM tokens sont sauvegardés dans Firestore
- Vérifiez que les messages ont `conversationId` rempli correctement

### "Backend keeps going down"
- Utilisez UptimeRobot pour le garder actif
- Vérifiez les logs pour les erreurs de crash

---

## URLs importantes

- **Dashboard Render**: https://dashboard.render.com
- **Logs backend**: https://dashboard.render.com/services/[service-id]/logs
- **GitHub**: https://github.com/YOUR_USERNAME/fcm-backend
- **UptimeRobot**: https://uptimerobot.com

---

## ✅ Success Checklist

- [ ] Dépôt GitHub créé et code poussé
- [ ] Compte Render créé
- [ ] Web Service créé dans Render
- [ ] Variables d'environnement ajoutées
- [ ] Backend déployé (pas d'erreurs)
- [ ] `/health` répond OK
- [ ] Backend écoute Firestore
- [ ] UptimeRobot configuré (optionnel)

---

## Coût

- Render: **$0/mois** (tier gratuit généreux)
- Firebase (Spark): **$0/mois**
- UptimeRobot: **$0/mois** (gratuit)
- **TOTAL: $0/mois** 🎉

---

## C'est fait!

Votre backend FCM est maintenant **en vie** et envoie des notifications 24/7! 🚀

Vérifiez les logs régulièrement pour voir les notifications être envoyées en temps réel.

**Besoin d'aide?** Référez-vous à ce guide ou créez une issue sur GitHub.
