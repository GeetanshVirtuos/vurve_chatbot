// Simple test to verify script loads
console.log('🎁 GiftCart Widget Test Script Loaded!');
console.log('Config:', window.GIFTCART_CHAT_CONFIG);

// Create a visible test element
const testDiv = document.createElement('div');
testDiv.style.cssText = 'position:fixed;bottom:20px;right:20px;background:red;color:white;padding:20px;z-index:999999;';
testDiv.textContent = 'WIDGET LOADED!';
document.body.appendChild(testDiv);

setTimeout(() => {
  testDiv.remove();
  console.log('Test element removed - widget.js should take over');
}, 3000);
