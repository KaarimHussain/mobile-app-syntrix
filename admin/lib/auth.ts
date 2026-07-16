const TOKEN_KEY = 'adminToken';

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `adminToken=${token}; path=/; max-age=86400; SameSite=Lax`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = 'adminToken=; path=/; max-age=0';
}
