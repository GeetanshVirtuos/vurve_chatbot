# Backend CORS Configuration for Shopify Integration

## Critical: Add this to your FastAPI backend

The widget runs in the browser from Shopify storefronts, so your backend MUST support CORS.

### Required Changes

Add to your FastAPI app (in the main file where you create the FastAPI instance):

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware - CRITICAL FOR SHOPIFY
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://*.myshopify.com",      # All Shopify stores
        "https://yourstore.com",         # Your production store (if custom domain)
        "http://localhost:3000",         # Next.js frontend (if still using)
    ],
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],   # Widget uses POST, browser sends OPTIONS preflight
    allow_headers=["*"],
)

# ... rest of your app
```

### Why This is Required

1. **Browser Security**: The widget runs in the customer's browser
2. **Cross-Origin Requests**: Shopify store → your backend API (different domains)
3. **Preflight Requests**: Browser sends OPTIONS before POST
4. **Without CORS**: Browser blocks all API calls → widget won't work

### Testing CORS

```bash
# Test from command line (should work)
curl -X POST http://localhost:8000/api/v1/talk \
  -H "Content-Type: application/json" \
  -d '{"user_uuid": "test-123", "msg": "hello"}'

# Test OPTIONS (browser preflight)
curl -X OPTIONS http://localhost:8000/api/v1/talk \
  -H "Origin: https://test.myshopify.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Look for these headers in response:
- `Access-Control-Allow-Origin: https://test.myshopify.com`
- `Access-Control-Allow-Methods: POST, OPTIONS`

### Production Setup

For production, be more specific with origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-actual-store.myshopify.com",
        "https://yourstore.com",
    ],
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
```

### Troubleshooting

**Still getting CORS errors?**

1. Check browser console for exact error
2. Verify middleware is BEFORE route definitions
3. Test with `curl -v` to see actual headers
4. Ensure backend is returning proper headers
5. Check if nginx/proxy is stripping CORS headers

**See "OPTIONS 405" error?**

Your backend doesn't handle OPTIONS requests. The CORS middleware should fix this automatically.

**See "No 'Access-Control-Allow-Origin' header"?**

- CORS middleware not configured
- Or origin not in allow_origins list
- Or middleware is after routes (move it up)

---

This is **THE MOST COMMON ISSUE** when integrating with Shopify. Make sure this is set up correctly!
