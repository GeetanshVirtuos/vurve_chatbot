# GiftCart AI Chatbot - Shopify App

A production-ready Shopify app that embeds an AI chatbot widget into any Shopify store. Built with vanilla JavaScript, Shadow DOM for perfect theme isolation, and comprehensive error handling.

## 🎯 Architecture

```
Shopify Store
    ↓
Theme App Extension (Liquid injection)
    ↓
Vanilla JS Widget (Shadow DOM)
    ↓
Your FastAPI Backend
```

## ✨ Features

### Widget Features
- ✅ **Lightweight**: <30KB total size
- ✅ **Shadow DOM**: Complete style isolation from store themes
- ✅ **Responsive**: Works perfectly on mobile and desktop
- ✅ **Retry Logic**: Automatic retry with exponential backoff
- ✅ **Persistent UUID**: User tracking across sessions
- ✅ **Markdown Support**: Basic text formatting (bold, italic, links)
- ✅ **Typing Indicator**: Professional loading states
- ✅ **Error Handling**: Graceful error messages
- ✅ **Customizable**: Brand colors and position via Shopify settings

### App Features
- ✅ **Full OAuth**: Secure Shopify app installation
- ✅ **Settings Panel**: Configure API URL in Shopify admin
- ✅ **Database**: Store per-shop configuration (Prisma + SQLite)
- ✅ **Webhooks**: Handle app uninstall events

## 🚀 Quick Start

### Prerequisites

1. **Shopify Partner Account**
   - Sign up at: https://partners.shopify.com
   - Create a development store

2. **Shopify CLI**
   ```bash
   npm install -g @shopify/cli @shopify/app
   ```

3. **Cloudflare Tunnel (for exposing localhost)**
   ```bash
   brew install cloudflare/cloudflare/cloudflared
   ```
   See [CLOUDFLARE_TUNNEL.md](CLOUDFLARE_TUNNEL.md) for setup

4. **Your Backend Running**
   - Ensure your FastAPI backend is accessible
   - Update CORS settings (see Backend Setup below)

### Installation

1. **Clone and Install**
   ```bash
   cd Shopify_App
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   ```env
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret
   HOST=https://your-tunnel.trycloudflare.com  # From Cloudflare Tunnel
   BACKEND_API_URL=https://bot.api.vurve.ai/api/v1/talk
   ```

4. **Initialize Database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

   This will:
   - Start the Remix app on localhost:3000
   - Shopify CLI will open browser to install app
   
   **Note:** Keep Cloudflare Tunnel running in a separate terminal!
   ```

   This will:
   - Start the Remix app
   - Create an ngrok tunnel
   - Open your dev store
   - Install the app automatically

### Configure Widget in Shopify

1. Go to **Online Store → Themes → Customize**
2. Click **App embeds** in the left sidebar (bottom)
3. Enable **GiftCart Chatbot**
4. Configure:
   - API URL (your backend endpoint)
   - Primary Color (brand color)
   - Position (bottom-right or bottom-left)
5. **Save** your theme

## 🔧 Backend Setup

Your FastAPI backend MUST support CORS. Add this to your FastAPI app:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://*.myshopify.com",
        "https://yourstore.com",
        "http://localhost:*"
    ],
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)
```

## 📁 Project Structure

```
Shopify_App/
├── app/                          # Remix application
│   ├── routes/
│   │   ├── app._index.tsx       # Settings page
│   │   ├── auth.$.tsx           # OAuth flow
│   │   └── webhooks.tsx         # Webhook handlers
│   ├── shopify.server.ts        # Shopify app config
│   └── db.server.ts             # Database client
├── extensions/
│   └── chatbot-widget/          # Theme app extension
│       ├── blocks/
│       │   └── app-embed.liquid # Liquid template
│       ├── assets/
│       │   └── widget.js        # Vanilla JS widget
│       └── shopify.extension.toml
├── prisma/
│   └── schema.prisma            # Database schema
└── package.json
```

## 🎨 Widget Customization

The widget supports customization via Shopify theme settings:

### Available Settings

- **API URL**: Your backend endpoint
- **Primary Color**: Main brand color (hex code)
- **Position**: `bottom-right` or `bottom-left`

### Programmatic Configuration

You can also configure via JavaScript before the widget loads:

```javascript
window.GIFTCART_CHAT_CONFIG = {
  apiUrl: 'https://your-api.com/api/v1/talk',
  theme: {
    primaryColor: '#0284c7',
    position: 'bottom-right'
  }
};
```

## 🔌 API Integration

### Request Format

```json
{
  "user_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "msg": "Show me romantic gifts"
}
```

### Success Response

```json
{
  "user_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "bot_message": "Here are some romantic gift ideas..."
}
```

### Error Response

```json
{
  "user_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "error": "Something went wrong"
}
```

## 🛠️ Development

### Run Dev Server

```bash
npm run dev
```

### Deploy to Production

1. **Update Configuration**
   - Change `HOST` to your production domain
   - Update `BACKEND_API_URL` to production backend

2. **Deploy App**
   ```bash
   npm run deploy
   ```

3. **Submit for Review**
   - Go to Shopify Partners dashboard
   - Submit your app for review

## 🐛 Debugging

### Widget Not Appearing

1. Check if app embed is enabled in theme customizer
2. Verify widget.js is loading (check browser console)
3. Check for JavaScript errors in console

### API Calls Failing

1. Verify backend is accessible from browser
2. Check CORS headers in backend
3. Verify API URL in settings is correct
4. Check browser Network tab for failed requests

### Styling Issues

The widget uses Shadow DOM, so it should be isolated. If you see style conflicts:
- Ensure Shadow DOM is supported (all modern browsers)
- Check console for Shadow DOM errors

## 📱 Mobile Support

The widget is fully responsive and includes:
- Touch-friendly button size (56px minimum)
- Optimized layout for small screens
- Keyboard-aware input (won't be hidden by virtual keyboard)
- Swipe-friendly scrolling

## 🔐 Security Best Practices

1. **Never expose backend API keys** in the widget
2. Use **HTTPS** for production backend
3. Validate all user inputs on backend
4. Implement **rate limiting** on your backend
5. Use Shopify's **OAuth** for app installation

## 📊 Performance

- **Widget size**: ~28KB minified
- **First paint**: <100ms
- **API timeout**: 30s with retry
- **Max retries**: 3 with exponential backoff

## 🆘 Support

### Common Issues

**"OPTIONS request 405 error"**
- Backend doesn't support CORS
- Add CORS middleware (see Backend Setup)

**"Widget not loading"**
- Check browser console for errors
- Verify script URL in Liquid template

**"Styles look broken"**
- Ensure Shadow DOM is working
- Check browser compatibility

## 📚 Resources

- [Shopify App Development](https://shopify.dev/docs/apps)
- [Theme App Extensions](https://shopify.dev/docs/apps/online-store/theme-app-extensions)
- [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)

## 📝 License

Proprietary - GiftCart

---

**Built with 💙 for GiftCart**
