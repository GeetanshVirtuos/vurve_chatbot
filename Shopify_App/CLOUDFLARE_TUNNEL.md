# Cloudflare Tunnel Setup for Shopify Development

## Why Cloudflare Tunnel > ngrok

✅ **Completely FREE** (no paid plans needed)  
✅ **Permanent URL** (doesn't change on restart)  
✅ **No rotation** (same URL forever)  
✅ **Faster** (Cloudflare's global network)  
✅ **Built-in DDoS protection**  
✅ **No request limits**  

❌ ngrok free: Rotates URL every restart, limited connections

## Quick Setup (10 minutes)

### Step 1: Install Cloudflared

**macOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Linux:**
```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

**Windows:**
Download from: https://github.com/cloudflare/cloudflared/releases

### Step 2: Login to Cloudflare

```bash
cloudflared tunnel login
```

This opens your browser. You'll:
1. Login to Cloudflare (or create free account)
2. Select a domain (or use free `.trycloudflare.com` subdomain)
3. Authorize the tunnel

### Step 3: Create a Tunnel

```bash
# Create a named tunnel (recommended)
cloudflared tunnel create shopify-dev

# This creates a tunnel ID and credentials file
# Note the Tunnel ID shown (you'll need it)
```

### Step 4: Configure the Tunnel

Create a config file at `~/.cloudflared/config.yml`:

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /Users/YOUR_USERNAME/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Route all traffic to localhost:3000 (Remix dev server)
  - hostname: your-app-name.yourdomain.com
    service: http://localhost:3000
  # Catch-all rule (required)
  - service: http_status:404
```

**OR use quick tunnel (no domain needed):**

Just skip config and use the quick command in Step 5b below.

### Step 5a: Route DNS (if using your domain)

```bash
cloudflared tunnel route dns shopify-dev your-app-name.yourdomain.com
```

### Step 5b: OR Use Quick Tunnel (No Domain Needed)

This gives you a free `*.trycloudflare.com` URL:

```bash
cloudflared tunnel --url http://localhost:3000
```

You'll get output like:
```
Your quick Tunnel has been created! Visit it at:
https://random-name-1234.trycloudflare.com
```

**⚠️ Quick Tunnel URLs are temporary** - Use named tunnels (Step 3-5a) for permanent URLs.

### Step 6: Run the Tunnel

**Named tunnel (permanent URL):**
```bash
cloudflared tunnel run shopify-dev
```

**Quick tunnel (temporary, but free):**
```bash
cloudflared tunnel --url http://localhost:3000
```

### Step 7: Update .env

Copy the URL from terminal output and update `.env`:

```env
HOST=https://your-app-name.yourdomain.com
```

Or if using quick tunnel:
```env
HOST=https://random-name-1234.trycloudflare.com
```

## 🚀 Development Workflow

### Terminal Setup

You'll need 2-3 terminals:

```bash
# Terminal 1: Cloudflare Tunnel (keep running)
cloudflared tunnel run shopify-dev

# Terminal 2: Shopify App (Remix)
cd Shopify_App
npm run dev

# Terminal 3: Your FastAPI Backend
cd chatbot
source venv/bin/activate
uvicorn src.app.main:app --reload
```

## 🎯 Recommended: Named Tunnel (Permanent URL)

For the best dev experience:

1. **Get a free domain** (if you don't have one):
   - Use Cloudflare Registrar ($9/year)
   - Or add existing domain to Cloudflare (free)
   - Or use free subdomain providers + Cloudflare DNS

2. **Create named tunnel** (Steps 3-5a above)

3. **Get permanent URL** like:
   - `https://shopify-dev.yourdomain.com`
   - Never changes, even after restarts!

## Alternative: Free Subdomain Options

If you don't want to buy a domain:

### Option 1: Use Cloudflare Pages (Permanent + Free)

Actually, for Remix apps, you can deploy to Cloudflare Pages for free and get a permanent URL automatically!

### Option 2: LocalTunnel (Another Free Alternative)

```bash
npm install -g localtunnel
lt --port 3000 --subdomain your-app-name
```

Gets you: `https://your-app-name.loca.lt`

But **Cloudflare Tunnel is still better** for reliability.

## 📝 Update shopify.app.toml

After getting your permanent URL, update:

```toml
application_url = "https://your-app-name.yourdomain.com"

[auth]
redirect_urls = [
  "https://your-app-name.yourdomain.com/auth/callback",
  "https://your-app-name.yourdomain.com/auth/shopify/callback",
  "https://your-app-name.yourdomain.com/api/auth/callback"
]

[build]
dev_store_url = "your-dev-store.myshopify.com"
```

## 🔧 Troubleshooting

### "Tunnel not connecting"
- Check if port 3000 is running (`npm run dev`)
- Verify config.yml syntax
- Try `cloudflared tunnel cleanup shopify-dev`

### "404 on tunnel URL"
- Ensure Remix app is running on port 3000
- Check ingress rules in config.yml
- Restart tunnel

### "DNS not propagating"
- Wait 5 minutes for DNS
- Clear browser cache
- Try incognito mode

## 💡 Pro Tip: Auto-start on Mac

Create a launch agent to auto-start tunnel:

```bash
# Save to ~/Library/LaunchAgents/com.cloudflare.tunnel.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cloudflare.tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/cloudflared</string>
        <string>tunnel</string>
        <string>run</string>
        <string>shopify-dev</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.cloudflare.tunnel.plist
```

---

**TL;DR:**
```bash
# Install
brew install cloudflare/cloudflare/cloudflared

# Create permanent tunnel
cloudflared tunnel login
cloudflared tunnel create shopify-dev
cloudflared tunnel route dns shopify-dev shopify-dev.yourdomain.com

# Run (keep this terminal open)
cloudflared tunnel run shopify-dev

# Update .env with your tunnel URL
```

**For quick testing without domain:**
```bash
cloudflared tunnel --url http://localhost:3000
# Copy the URL shown and paste in .env
```

Much better than ngrok! 🚀
