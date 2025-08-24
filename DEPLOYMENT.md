# Deployment Instructions for Tanks Game

## Deploy to Render (Free Hosting)

### Prerequisites
- GitHub account
- Render account (free at render.com)

### Steps:

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin master
   ```

2. **Deploy to Render:**
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your Tanks repository
   - Fill in the details:
     - **Name**: tanks-game (or your preferred name)
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
   - Click "Create Web Service"

3. **Access your game:**
   - Once deployed, Render will give you a URL like: `https://tanks-game.onrender.com`
   - Share this URL with friends!
   - Game: `https://your-app.onrender.com/game.html`
   - Controller: `https://your-app.onrender.com/controller.html`

### Alternative Free Hosting Options:

#### Glitch.com (Easiest, no credit card)
1. Go to [glitch.com](https://glitch.com)
2. Click "New Project" → "Import from GitHub"
3. Paste your GitHub repo URL
4. Your app will be live at: `https://your-project.glitch.me`

#### Railway.app (Free trial)
1. Go to [railway.app](https://railway.app)
2. Click "Start New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-deploy your app

#### Fly.io (Free tier available)
1. Install flyctl: `brew install flyctl`
2. Run: `fly launch`
3. Follow the prompts
4. Deploy with: `fly deploy`

### Notes:
- Free tiers may have limitations (sleep after inactivity, limited hours)
- Render free tier sleeps after 15 minutes of inactivity
- Your game works with WebSockets, so make sure the hosting supports them (all above do)