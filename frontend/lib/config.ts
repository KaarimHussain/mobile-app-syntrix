// Environment-driven configuration (PRD §5).
// All values overridable via EXPO_PUBLIC_* env vars without code changes.

export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api',
  appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  defaultTheme: (process.env.EXPO_PUBLIC_DEFAULT_THEME ?? 'light') as 'light' | 'dark',
  primaryColor: process.env.EXPO_PUBLIC_PRIMARY_COLOR ?? '#16A34A',
  appName: process.env.EXPO_PUBLIC_APP_NAME ?? 'Syntrix Real Estate',
  enableNotifications: (process.env.EXPO_PUBLIC_ENABLE_NOTIFICATIONS ?? 'true') === 'true',
  // Business toggles (mirrored from backend in v1 mock mode)
  requireOwnerApproval: (process.env.EXPO_PUBLIC_REQUIRE_OWNER_APPROVAL ?? 'true') === 'true',
  defaultCommissionRate: Number(process.env.EXPO_PUBLIC_DEFAULT_COMMISSION_RATE ?? 1.5),
};
