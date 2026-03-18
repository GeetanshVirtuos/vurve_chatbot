export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const STORAGE_KEY = 'giftcart_user_uuid';
  
  let userId = localStorage.getItem(STORAGE_KEY);
  
  if (!userId) {
    // Generate a simple UUID v4
    userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    
    localStorage.setItem(STORAGE_KEY, userId);
  }
  
  return userId;
}

export function clearUserId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('giftcart_user_uuid');
  }
}
