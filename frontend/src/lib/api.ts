export const API_BASE_URL =
  typeof window !== 'undefined'
    ? ''
    : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000');

export const N8N_WEBHOOK_URL =
  typeof window !== 'undefined'
    ? '/webhook'
    : (process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://127.0.0.1:5678/webhook');
