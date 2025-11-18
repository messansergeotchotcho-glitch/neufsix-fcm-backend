# ⚡ LAUNCH NOW - 3 STEPS

## Step 1: GitHub (2 min)

```
1. https://github.com/new
2. Nom: fcm-backend
3. Public
4. Create
5. Copier l'URL
```

```powershell
cd c:\neufsix_work\fcm-backend
git remote add origin https://github.com/VOTRE_USER/fcm-backend.git
git branch -M main
git push -u origin main
```

## Step 2: Render (5 min)

```
1. https://render.com
2. Sign up with GitHub
3. New → Web Service
4. Select fcm-backend repo
5. Settings:
   - Name: fcm-backend
   - Runtime: Node
   - Build: npm install
   - Start: node index.js
6. Environment variables (copier .env)
7. Create
```

## Step 3: Test (2 min)

```
Attendre 2-3 min
Allez à: https://fcm-backend-xxxx.onrender.com/health
Devrait voir: { "status": "ok", ... }
```

---

## Done! 🎉

Votre backend est LIVE!

Consulter `GITHUB_PUSH_QUICK.md` pour plus de détails.
