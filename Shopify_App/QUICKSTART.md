# Quick Start Commands - Copy & Paste

## One-Time Setup

```bash
# 1. Install Cloudflared (macOS)
brew install cloudflare/cloudflare/cloudflared

# 2. Install dependencies
cd Shopify_App
npm install

# 3. Setup database
npx prisma migrate dev --name init
npx prisma generate

# 4. Install Shopify CLI (if you haven't)
npm install -g @shopify/cli @shopify/app

# 5. Login to Shopify
shopify auth login
```

## Every Time You Develop

### Terminal 1: Start Cloudflare Tunnel
```bash
cd Shopify_App
cloudflared tunnel --url http://localhost:3000
```
**→ Copy the URL shown (https://abc-123.trycloudflare.com)**  
**→ Paste it in your .env file as HOST=...**

**Keep this terminal running!**

### Terminal 2: Start Shopify App
```bash
cd Shopify_App
npm run dev
```
**→ Browser will open asking you to install the app**  
**→ Click "Install"**

### Terminal 3: Backend (if running locally)
```bash
cd chatbot
source venv/bin/activate
uvicorn src.app.main:app --reload --port 8000
```

**Or skip this** - your production backend at https://bot.api.vurve.ai is already configured!

## First Time Only: Enable Widget in Shopify

1. Click the preview link from `npm run dev`
2. In Shopify Admin → **Online Store** → **Themes** → **Customize**
3. Left sidebar → scroll to **App embeds**
4. Toggle ON **"GiftCart Chatbot"**
5. Click settings icon:
   - API URL: `https://bot.api.vurve.ai/api/v1/talk`
   - Primary Color: `#0284c7` (or your brand color)
   - Position: `bottom-right`
6. **Save**

## Test It!

Click "Preview" in theme editor → You should see the chat button!

## Troubleshooting

**Cloudflare Tunnel not starting?**
```bash
# Make sure port 3000 is free
lsof -i :3000
kill -9 <PID>  # if something is using it
```

**App not installing?**
- Make sure Cloudflare Tunnel is running (Terminal 1)
- Check that HOST in .env matches the Cloudflare URL
- Try: `shopify app config link` then `npm run dev` again

**Widget not showing?**
- Check App embeds is toggled ON
- Check browser console for errors (F12)
- Verify API URL in widget settings

**CORS errors in browser?**
Your backend needs CORS setup - see [BACKEND_CORS.md](BACKEND_CORS.md)

---

**That's it!** You now have a working Shopify chatbot! 🎉
