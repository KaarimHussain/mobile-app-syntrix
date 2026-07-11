import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { ClayButton, ClayCard, ClayInput } from '@/components/clay';
import { config } from '@/lib/config';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme-context';
import { useToast } from '@/components/Toast';

export default function LoginScreen() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const { show } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const validateEmail = (emailStr: string) => {
    const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return reg.test(emailStr.trim());
  };

  const submit = async () => {
    if (!email.trim()) {
      show('Email address is required.', 'error');
      return;
    }
    if (!validateEmail(email)) {
      show('Please enter a valid email address.', 'error');
      return;
    }
    if (!password.trim()) {
      show('Password is required.', 'error');
      return;
    }
    const err = await login(email, password);
    if (err) {
      show(err, 'error');
    } else {
      show('Signed in successfully!', 'success');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', padding: 24 }}>
      <View
        style={{
          alignSelf: 'center',
          width: 72,
          height: 72,
          borderRadius: 24,
          backgroundColor: theme.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}>
        <Building2 size={36} color={theme.primary} />
      </View>
      <Text style={{ color: theme.primary, fontFamily: 'Inter-ExtraBold', fontSize: 30, textAlign: 'center', letterSpacing: -0.5 }}>
        {config.appName}
      </Text>
      <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', textAlign: 'center', marginTop: 6, marginBottom: 24 }}>
        Property & team management
      </Text>
      <ClayCard style={{ padding: 20 }}>
        <ClayInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@company.pk"
        />
        <ClayInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        <ClayButton title="Sign in" onPress={submit} />
      </ClayCard>
      <View style={{ marginTop: 20 }}>
        <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 12, textAlign: 'center' }}>
          Demo accounts: owner@demo.pk (Owner) · ali@demo.pk / sana@demo.pk (Employee) — any password
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
