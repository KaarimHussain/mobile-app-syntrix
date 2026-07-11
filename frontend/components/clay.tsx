import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { FolderOpen } from 'lucide-react-native';
import { clayPressed, clayRaised, radius } from '@/constants/theme';
import { useTheme } from '@/lib/theme-context';
import { ThemeTokens } from '@/constants/theme';

export function ClayCard({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const { theme } = useTheme();
  const base: ViewStyle = {
    backgroundColor: theme.surface,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    ...clayRaised(theme),
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && clayPressed(theme), style]}>
      {children}
    </Pressable>
  );
}

export function ClayButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  const [pressed, setPressed] = useState(false);
  const bg =
    variant === 'primary' ? theme.primary : variant === 'danger' ? theme.danger : theme.surfaceAlt;
  const fg = variant === 'ghost' ? theme.textPrimary : theme.onPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        {
          backgroundColor: bg,
          opacity: disabled ? 0.5 : 1,
          borderRadius: radius.sm,
          paddingVertical: 9,
          paddingHorizontal: 14,
          alignItems: 'center',
          ...(pressed ? clayPressed(theme) : clayRaised(theme)),
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}>
      <Text style={{ color: fg, fontFamily: 'Inter-Bold', fontSize: 13, letterSpacing: 0.2 }}>{title}</Text>
    </Pressable>
  );
}

export function ClayInput(props: TextInputProps & { label?: string }) {
  const { theme } = useTheme();
  const { label, style, ...rest } = props;
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 8 }}>
      {label ? (
        <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-SemiBold', fontSize: 12, marginBottom: 4 }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          {
            backgroundColor: theme.surfaceAlt,
            color: theme.textPrimary,
            borderRadius: radius.sm,
            paddingHorizontal: 12,
            paddingVertical: 9,
            fontSize: 14,
            fontFamily: 'Inter-Regular',
            borderWidth: 1.5,
            borderColor: focused ? theme.primary : 'transparent',
            ...clayPressed(theme),
          } as TextStyle,
          style,
        ]}
      />
    </View>
  );
}

export function IconButton({ icon: IconComponent, onPress }: { icon: React.ComponentType<any>; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 34,
        height: 34,
        borderRadius: radius.xs,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        ...(pressed ? clayPressed(theme) : clayRaised(theme)),
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}>
      <IconComponent size={16} color={theme.textPrimary} />
    </Pressable>
  );
}

export function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  const { theme } = useTheme();
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.cardBorder,
        ...clayRaised(theme),
      }}>
      <Text style={{ color: theme.primary, fontFamily: 'Inter-Bold', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export function Chip({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'primary' }) {
  const { theme } = useTheme();
  const map: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: theme.surfaceAlt, fg: theme.textSecondary },
    success: { bg: theme.primarySoft, fg: theme.success },
    warning: { bg: 'rgba(245,158,11,0.15)', fg: theme.warning },
    danger: { bg: 'rgba(239,68,68,0.12)', fg: theme.danger },
    primary: { bg: theme.primarySoft, fg: theme.primary },
  };
  const c = map[tone] || map.neutral;
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ color: c.fg, fontFamily: 'Inter-Bold', fontSize: 10 }}>{label}</Text>
    </View>
  );
}

export function StatCard({ label, value, hint, icon: IconComponent }: { label: string; value: string; hint?: string; icon?: React.ComponentType<any> }) {
  const { theme } = useTheme();
  return (
    <ClayCard style={{ flex: 1, minWidth: 130 }}>
      {IconComponent ? (
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: radius.xs,
            backgroundColor: theme.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}>
          <IconComponent size={15} color={theme.primary} />
        </View>
      ) : null}
      <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-SemiBold', fontSize: 10, letterSpacing: 0.3, textTransform: 'uppercase' }}>
        {label}
      </Text>
      <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-ExtraBold', fontSize: 18, marginTop: 2 }}>{value}</Text>
      {hint ? <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 10, marginTop: 1 }}>{hint}</Text> : null}
    </ClayCard>
  );
}

export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 3.5, height: 14, borderRadius: 1.5, backgroundColor: theme.primary }} />
        <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 15 }}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function EmptyState({ message, icon: IconComponent = FolderOpen }: { message: string; icon?: React.ComponentType<any> }) {
  const { theme } = useTheme();
  return (
    <ClayCard style={{ alignItems: 'center', paddingVertical: 20 }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}>
        <IconComponent size={18} color={theme.textSecondary} />
      </View>
      <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13, textAlign: 'center' }}>{message}</Text>
    </ClayCard>
  );
}

export function Screen({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return <View style={{ flex: 1, backgroundColor: theme.background }}>{children}</View>;
}

export const formatPKR = (n: number) =>
  n >= 10000000
    ? `PKR ${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1)} Cr`
    : n >= 100000
    ? `PKR ${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} Lac`
    : `PKR ${n.toLocaleString()}`;

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
});
