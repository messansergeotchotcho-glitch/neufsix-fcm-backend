# 📤 Push to GitHub NOW!

## ⚡ Commandes rapides (Copier-Coller)

### 1. Créer le repo GitHub
Allez sur: https://github.com/new

```
Nom: fcm-backend
Description: FCM notification backend for Neufsix
Visibilité: PUBLIC ← Important!
Créer le repo
```

Vous obtiendrez une URL: `https://github.com/VOTRE_USERNAME/fcm-backend.git`

### 2. Pousser le code (PowerShell)

**Remplacez `VOTRE_USERNAME` par votre vrai username!**

```powershell
cd c:\neufsix_work\fcm-backend
git remote add origin https://github.com/VOTRE_USERNAME/fcm-backend.git
git branch -M main
git push -u origin main
```

Si ça demande username/password:
- Username: votre username GitHub
- Password: votre **token personnel** (pas mot de passe!)

Pour créer un token:
1. Allez à: https://github.com/settings/tokens
2. Cliquez: Generate new token
3. Sélectionnez: `repo` (access to repositories)
4. Copiez le token
5. Utilisez-le comme "password" dans Git

### 3. Vérifier que c'est pushé

Allez sur: `https://github.com/VOTRE_USERNAME/fcm-backend`

Vous devriez voir:
- index.js
- package.json
- .env (⚠️ NE DEVRAIT PAS être là!)
- README.md
- DEPLOYMENT_GUIDE.md
- NEXT_STEPS.md
- STATUS.md

### ✅ Si vous voyez `.env` ou `firebase-service-account.json` → DANGEREUX!

Commande d'urgence pour supprimer:
```bash
git rm --cached .env firebase-service-account.json
git commit -m "Remove sensitive files"
git push
```

---

## Après: Aller sur Render

1. https://render.com/signup
2. Sign up with GitHub
3. Autoriser Render
4. Créer Web Service depuis `fcm-backend`
5. Ajouter Environment Variables
6. Deploy!

---

## ✨ Vous êtes prêt!

Allez-y! 🚀
