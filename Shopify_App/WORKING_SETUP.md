# Working Setup - Custom Cloudflare Tunnel

This is the **correct way** to run your Shopify app when Shopify CLI's auto-tunnel fails.

## Why This Works

Shopify CLI's automatic Cloudflare tunnel creation is failing with QUIC timeout errors. The solution is to **bring your own tunnel** and tell Shopify CLI to use it.

## The 3-Terminal Setup

**IMPORTANT: Start in this exact order!**

### Terminal 1: Start Cloudflare Tunnel FIRST

This exposes your localhost:3000 to the internet:

```bash
cloudflared tunnel --url http://localhost:3000 --protocol http2
```

**Copy the URL** that appears, something like:
```
https://accidents-barbara-fingers-tvs.trycloudflare.com
```

**Keep this terminal running!**

### Terminal 2: Start Remix App Locally

This runs ONLY the Remix server on localhost:3000 (no Shopify CLI, no tunnel):

```bash
cd Shopify_App
npx remix dev --port 3000
```

**Wait until you see:** "Remix dev server started..."

### Terminal 3: Start Shopify CLI with Custom Tunnel

Replace `YOUR-TUNNEL-URL` with the URL from Terminal 1:

```bash
cd Shopify_App
shopify app dev --tunnel-url=https://YOUR-TUNNEL-URL:3000
```

**Example:**
```bash
shopify app dev --tunnel-url=https://accidents-barbara-fingers-tvs.trycloudflare.com:3000
```

**Important:** Notice `:3000` at the end - this tells Shopify CLI which local port your Remix app is on.

## What Each Terminal Does

| Terminal | Command | Purpose |
|----------|---------|---------|
| 1 | `npx remix dev --port 3000` | Runs your Remix app locally |
| 2 | `cloudflared tunnel --url http://localhost:3000` | Makes localhost:3000 publicly accessible |
| 3 | `shopify app dev --tunnel-url=https://...` | Shopify CLI uses your tunnel instead of creating its own |

## Common Issues

### "Port 3000 already in use"
- Kill the process: `lsof -ti:3000 | xargs kill -9`
- Or use a different port (update all 3 terminals)

### "Permission denied ::1:443"
- **Wrong:** `--tunnel-url=https://url:443`
- **Right:** `--tunnel-url=https://url:3000`
- Use port 3000 (your local app port), NOT 443

### "Tunnel URL invalid format"
- **Wrong:** `--tunnel-url=https://url.com`
- **Right:** `--tunnel-url=https://url.com:3000`
- Must include `:PORT`

### Cloudflare tunnel stops working
- Ctrl+C in Terminal 2
- Restart: `cloudflared tunnel --url http://localhost:3000 --protocol http2`
- Copy the NEW URL (it changes each restart)
- Update Terminal 3 command with new URL
- Restart Shopify CLI in Terminal 3

## Why Not Just `npm run dev`?

`npm run dev` runs `shopify app dev`, which tries to:
1. Start Remix
2. Create its own Cloudflare tunnel (this fails on your network)
3. Start Shopify CLI

We're separating these steps so we can use our own working tunnel.

## Quick Reference

**Start in this exact order:**

```bash
# Terminal 1 - START THIS FIRST
cloudflared tunnel --url http://localhost:3000 --protocol http2
# Copy the URL shown, keep running

# Terminal 2 - START AFTER TUNNEL IS RUNNING
npx remix dev --port 3000
# Wait for "built" message

# Terminal 3 - START LAST
shopify app dev --tunnel-url=https://YOUR-COPIED-URL:3000
```

## After It's Running

1. Shopify CLI will open a browser
2. Install the app in your dev store
3. Go to **Online Store → Themes → Customize**
4. Enable **App embeds → GiftCart Chatbot**
5. Configure the API URL in the app settings
6. Test the widget on your store!

---

**Pro Tip:** Keep all 3 terminals visible so you can monitor logs from each component.
