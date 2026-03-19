# Quick Setup Guide

## 🎯 For First-Time Setup (10 minutes)

### Step 1: Shopify Partner Setup
1. Go to https://partners.shopify.com
2. Sign up / Log in
3. Click "Apps" → "Create app"
4. Choose "Create app manually"
5. Fill in app name: "GiftCart Chatbot"
6. Copy the **API key** and **API secret**

### Step 2: Create Development Store
1. In Partners dashboard → "Stores" → "Add store"
2. Select "Development store"
3. Fill in store details
4. Copy the store URL (e.g., `your-dev-store.myshopify.com`)

### Step 3: Setup Cloudflare Tunnel (for permanent URL)

**See [CLOUDFLARE_TUNNEL.md](CLOUDFLARE_TUNNEL.md) for detailed instructions.**

Quick version:
```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared

# Quick tunnel (no domain needed) - gives you *.trycloudflare.com URL
cloudflared tunnel --url http://localhost:3000
```

Copy the URL shown (like `https://abc-123.trycloudflare.com`) - you'll need it in Step 4.

**Keep this terminal running!** Open a new terminal for next steps.

### Step 4: Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Install Shopify CLI globally (if not already installed)
npm install -g @shopify/cli @shopify/app

# 3. Login to Shopify
shopify auth login

# 4. Link your app
shopify app config link

# 5. Create .env file
cp .env.example .env
```

Edit `.env`:
```env
SHOPIFY_API_KEY=<your-api-key>
SHOPIFY_API_SECRET=<your-api-secret>
SCOPES=write_products,read_customers
HOST=https://your-tunnel-url.trycloudflare.com  # ← Paste your Cloudflare Tunnel URL
BACKEND_API_URL=https://bot.api.vurve.ai/api/v1/talk
DATABASE_URL=file:./dev.db
```

```bash
# 6. Setup database
npx prisma migrate dev --name init
npx prisma generate

# 7. Start development server
npm run dev
```

### Step 5: Install in Dev Store

When you run `npm run dev`:
1. Browser will open to install the app
2. Click "Install"
3. You'll see the settings page

**Note:** Make sure your Cloudflare Tunnel (from Step 3) is still running!

### Step 6: Enable Widget in Theme

1. From Shopify Admin → "Online Store" → "Themes"
2. Click "Customize" on your active theme
3. Scroll down left sidebar
4. Find "App embeds" section
5. Toggle ON "GiftCart Chatbot"
6. Click settings icon to configure:
   - Set API URL: `https://bot.api.vurve.ai/api/v1/talk`
   - Choose primary color
   - Choose position
7. Click "Save"

### Step 7: Test!

1. Click "Preview" in theme customizer
2. You should see the chat button (bottom right/left)
3. Click it and send a test message
4. Check Network tab if issues occur

## 🔥 Important: Backend CORS Setup

Your FastAPI backend MUST allow requests from Shopify. Add this:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://*.myshopify.com",
        "https://yourstore.com"
    ],
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)
```

## 🐛 Troubleshooting

### "Cannot find module @shopify/..."
```bash
npm install
npx prisma generate
```

### "Database not found"
```bash
npx prisma migrate dev --name init
```

### Widget not showing
1. Check app embed is enabled
2. Check browser console for errors
3. Verify widget.js is loaded (Network tab)

### API calls failing
1. Check backend is running
2. Verify CORS is configured
3. Check API URL in settings
4. Look at Network tab in browser

## 📱 Development Workflow

You need 3 terminals running:

```bash
# Terminal 1: Cloudflare Tunnel (keep running)
cloudflared tunnel --url http://localhost:3000

# Terminal 2: Shopify app
cd Shopify_App
npm run dev

# Terminal 3: Your FastAPI backend (if running locally)
cd ../chatbot
source venv/bin/activate
uvicorn src.app.api.v1.chat:app --reload
```

**Or use production backend:** https://bot.api.vurve.ai already works!

## 🚀 Next Steps

1. ✅ Test the widget thoroughly
2. ✅ Customize colors to match your brand
3. ✅ Test on mobile devices
4. ✅ Add more widget features if needed
5. ✅ Deploy backend to production
6. ✅ Update API URL in Shopify settings
7. ✅ Submit app for review (if going to App Store)

---

Need help? Check the main README.md for detailed documentation.
