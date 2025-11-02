#!/bin/bash

# Firebase Setup and Deployment Script for yarlis.com

echo "🚀 Setting up Firebase for yarlis.com deployment"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Firebase CLI not found. Installing...${NC}"
    npm install -g firebase-tools
fi

# Login to Firebase (if not already logged in)
echo -e "${BLUE}Checking Firebase authentication...${NC}"
firebase login:list &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Please login to Firebase:${NC}"
    firebase login
fi

# Initialize Firebase project (if not already initialized)
if [ ! -f ".firebaserc" ]; then
    echo -e "${BLUE}Initializing Firebase project...${NC}"
    firebase init
fi

# Set the project
echo -e "${BLUE}Setting Firebase project...${NC}"
firebase use rapidtriage-prod

# Create Firebase sites for custom domains
echo -e "${BLUE}Creating Firebase Hosting sites...${NC}"
firebase hosting:sites:create yarlis-main 2>/dev/null || echo "Site yarlis-main already exists"
firebase hosting:sites:create yarlis-studio 2>/dev/null || echo "Site yarlis-studio already exists"

# Set up environment variables as Firebase functions config
echo -e "${BLUE}Setting up Firebase Functions configuration...${NC}"

# Read from .env.production if exists
if [ -f ".env.production" ]; then
    echo -e "${GREEN}Reading configuration from .env.production${NC}"

    # Set Firebase config (note: firebase functions:config is deprecated in newer versions)
    # For Firebase Functions v2, use environment variables or Secret Manager

    # Example of setting secrets (requires manual input of values)
    echo -e "${YELLOW}Setting up Firebase secrets...${NC}"
    echo "You'll need to manually set these secrets:"
    echo ""
    echo "firebase functions:secrets:set JWT_SECRET"
    echo "firebase functions:secrets:set ENCRYPTION_KEY"
    echo "firebase functions:secrets:set API_KEY"
    echo ""
fi

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install

# Install Functions dependencies
echo -e "${BLUE}Installing Functions dependencies...${NC}"
cd functions && npm install && cd ..

# Build the project
echo -e "${BLUE}Building the project...${NC}"
npm run build

# Create studio login page
echo -e "${BLUE}Creating studio login page...${NC}"
mkdir -p dist/studio

cat > dist/studio/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RapidTriageME Studio - Login</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .login-container {
      background: white;
      padding: 3rem;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 400px;
    }
    .logo {
      text-align: center;
      font-size: 2rem;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 2rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #4a5568;
      font-weight: 500;
    }
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .btn-login {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .btn-login:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }
    .divider {
      text-align: center;
      margin: 2rem 0;
      color: #718096;
      position: relative;
    }
    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e2e8f0;
    }
    .divider span {
      background: white;
      padding: 0 1rem;
      position: relative;
    }
    .oauth-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .btn-oauth {
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .btn-oauth:hover {
      background: #f7fafc;
      border-color: #cbd5e0;
    }
    .links {
      text-align: center;
      margin-top: 1.5rem;
    }
    .links a {
      color: #667eea;
      text-decoration: none;
      font-size: 0.9rem;
    }
    .links a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="logo">RapidTriageME Studio</div>

    <form id="loginForm">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required placeholder="you@example.com">
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required placeholder="••••••••">
      </div>

      <button type="submit" class="btn-login">Sign In</button>
    </form>

    <div class="divider"><span>Or continue with</span></div>

    <div class="oauth-buttons">
      <button class="btn-oauth" onclick="signInWithGoogle()">
        <span>🔍</span> Sign in with Google
      </button>
      <button class="btn-oauth" onclick="signInWithGitHub()">
        <span>🐙</span> Sign in with GitHub
      </button>
    </div>

    <div class="links">
      <a href="/register">Create an account</a> • <a href="/forgot-password">Forgot password?</a>
    </div>
  </div>

  <script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
    import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';

    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "rapidtriage-prod.firebaseapp.com",
      projectId: "rapidtriage-prod",
      storageBucket: "rapidtriage-prod.appspot.com",
      messagingSenderId: "YOUR_SENDER_ID",
      appId: "YOUR_APP_ID"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Email/Password login
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Logged in:', userCredential.user);
        window.location.href = '/dashboard';
      } catch (error) {
        alert('Login failed: ' + error.message);
      }
    });

    // Google Sign-In
    window.signInWithGoogle = async () => {
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        console.log('Logged in with Google:', result.user);
        window.location.href = '/dashboard';
      } catch (error) {
        alert('Google sign-in failed: ' + error.message);
      }
    };

    // GitHub Sign-In
    window.signInWithGitHub = async () => {
      const provider = new GithubAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        console.log('Logged in with GitHub:', result.user);
        window.location.href = '/dashboard';
      } catch (error) {
        alert('GitHub sign-in failed: ' + error.message);
      }
    };
  </script>
</body>
</html>
EOF

echo -e "${GREEN}✅ Studio login page created${NC}"

# Deploy to Firebase
echo -e "${BLUE}Deploying to Firebase...${NC}"
firebase deploy --only hosting,functions,firestore,storage

# Configure custom domains
echo -e "${YELLOW}Setting up custom domains...${NC}"
echo ""
echo "Please add these DNS records to your yarlis.com domain:"
echo ""
echo -e "${GREEN}For yarlis.com (main site):${NC}"
echo "Type: A"
echo "Name: @"
echo "Value: 151.101.1.195"
echo "Value: 151.101.65.195"
echo ""
echo -e "${GREEN}For studio.yarlis.com:${NC}"
echo "Type: CNAME"
echo "Name: studio"
echo "Value: yarlis-studio.web.app"
echo ""
echo "After adding DNS records, run:"
echo -e "${BLUE}firebase hosting:channel:deploy live --site yarlis-main${NC}"
echo -e "${BLUE}firebase hosting:channel:deploy live --site yarlis-studio${NC}"
echo ""
echo -e "${GREEN}Then connect custom domains in Firebase Console:${NC}"
echo "1. Go to Firebase Console > Hosting"
echo "2. Click 'Add custom domain'"
echo "3. Add yarlis.com for yarlis-main site"
echo "4. Add studio.yarlis.com for yarlis-studio site"
echo ""

echo -e "${GREEN}🎉 Firebase setup complete!${NC}"
echo ""
echo "Access your sites at:"
echo "- Main site: https://yarlis.com"
echo "- Studio: https://studio.yarlis.com"
echo ""