import { Platform, ViewStyle } from 'react-native';
import { config } from '@/lib/config';

export interface ThemeTokens {
  primary: string;
  primarySoft: string;
  onPrimary: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  shadowDark: string;
  shadowLight: string;
  cardBorder: string;
}

export const lightTheme: ThemeTokens = {
  primary: '#6366F1', // Premium Indigo
  primarySoft: '#EEF2FF',
  onPrimary: '#FFFFFF',
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9', // Slate 100
  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#64748B', // Slate 500
  border: '#E2E8F0', // Slate 200
  success: '#10B981', // Emerald 500
  warning: '#F59E0B', // Amber 500
  danger: '#EF4444', // Red 500
  shadowDark: 'rgba(15, 23, 42, 0.08)',
  shadowLight: 'rgba(255, 255, 255, 0.9)',
  cardBorder: '#F1F5F9',
};

export const darkTheme: ThemeTokens = {
  primary: '#818CF8', // Indigo 400
  primarySoft: '#1E1B4B',
  onPrimary: '#E0E7FF',
  background: '#0F172A', // Slate 900
  surface: '#1E293B', // Slate 800
  surfaceAlt: '#334155', // Slate 700
  textPrimary: '#F8FAFC', // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  border: '#334155', // Slate 700
  success: '#34D399', // Emerald 400
  warning: '#FBBF24', // Amber 400
  danger: '#F87171', // Red 400
  shadowDark: 'rgba(0, 0, 0, 0.3)',
  shadowLight: 'rgba(255, 255, 255, 0.03)',
  cardBorder: 'rgba(255, 255, 255, 0.05)',
};

export const radius = { xs: 6, sm: 8, md: 10, lg: 14, xl: 18 };

// Custom Premium Smooth elevation
export function clayRaised(t: ThemeTokens): ViewStyle {
  return Platform.select<ViewStyle>({
    android: { elevation: 3, shadowColor: t.shadowDark },
    default: {
      shadowColor: t.shadowDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
    },
  })!;
}

export function clayPressed(t: ThemeTokens): ViewStyle {
  return Platform.select<ViewStyle>({
    android: { elevation: 0 },
    default: {
      shadowColor: t.shadowDark,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.5,
      shadowRadius: 3,
    },
  })!;
}
