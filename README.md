# Password Keeper App

Ce projet est une application de gestion de mots de passe.

---

## Configuration

### Backend

Dans le dossier `/backend`, créez un fichier `.env` contenant les variables suivantes (les valeurs doivent être des exemples) :

```
SUPABASE_URL=https://dsfsdfsdfsdfsdfs.supabase.co
SUPABASE_ANON_KEY=eyJqoijodjkdjSLKJLSKDJLSKDJLKSQjqdlnqksjnldkqnLKSndkl
PORT=3001
SESSION_COOKIE_KEY=uQEqsdqsdqqODHJSHDJSNdsnqsjnlkjnsdlq
```

### Frontend
Dans le dossier /frontend, créez un fichier .env.local contenant les variables suivantes :

```
NEXT_PUBLIC_API_URL=http://localhost:3001/
SALT_SHA_256_HASHING=USHKFJDQHLDKJSQLKDUSHKFJDQHLDKJSQLKD
```

## Installation
Pour installer les dépendances du projet, exécutez les commandes suivantes :


### Backend
```
cd backend
npm install
```

### Frontend
```
cd ../frontend
npm install
```

## Lancement

### Backend
Pour lancer le backend, exécutez :

```
cd backend
npm start
```

### Frontend
Pour lancer le frontend, exécutez :

```
cd frontend
npm run dev
```

