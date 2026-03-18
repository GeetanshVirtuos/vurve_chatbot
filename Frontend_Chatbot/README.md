# GiftCart Chatbot Frontend

A production-grade Next.js chatbot interface for GiftCart.

## Features

- 🎨 Modern, responsive UI with Tailwind CSS
- 🔄 Automatic retry logic for failed requests
- 🛡️ Comprehensive error handling
- ⏳ Loading states and typing indicators
- 🔒 Input blocking during API calls
- 💾 Persistent user sessions with UUID
- ♿ Accessibility-friendly design
- 📱 Mobile-responsive layout

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your API configuration.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL`: Backend API base URL (default: http://localhost:8000)
- `NEXT_PUBLIC_API_ENDPOINT`: Chat endpoint path (default: /api/v1/talk)
- `NEXT_PUBLIC_MAX_RETRIES`: Maximum retry attempts (default: 3)
- `NEXT_PUBLIC_RETRY_DELAY`: Delay between retries in ms (default: 1000)

## Build for Production

```bash
npm run build
npm start
```

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- React Markdown
