import { CheckSquare, Building2, PlusCircle, DollarSign } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '@/lib/theme-context';

export default function EmployeeLayout() {
  const { theme } = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopWidth: 0,
          height: 62,
          paddingTop: 6,
          shadowColor: theme.shadowDark,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.6,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarLabelStyle: { fontSize: 11, fontFamily: 'Inter-Bold' },
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerTitleStyle: { fontFamily: 'Inter-ExtraBold' },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: theme.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'My Tasks', tabBarIcon: ({ color }) => <CheckSquare size={20} color={color} /> }} />
      <Tabs.Screen name="properties" options={{ title: 'Properties', tabBarIcon: ({ color }) => <Building2 size={20} color={color} /> }} />
      <Tabs.Screen name="referrals" options={{ title: 'Referrals', tabBarIcon: ({ color }) => <PlusCircle size={20} color={color} /> }} />
      <Tabs.Screen name="earnings" options={{ title: 'Earnings', tabBarIcon: ({ color }) => <DollarSign size={20} color={color} /> }} />
    </Tabs>
  );
}
