import { LayoutDashboard, Building2, Handshake, CheckSquare, Users } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '@/lib/theme-context';

export default function OwnerLayout() {
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
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <LayoutDashboard size={20} color={color} /> }} />
      <Tabs.Screen name="properties" options={{ title: 'Properties', tabBarIcon: ({ color }) => <Building2 size={20} color={color} /> }} />
      <Tabs.Screen name="deals" options={{ title: 'Deals', tabBarIcon: ({ color }) => <Handshake size={20} color={color} /> }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks', tabBarIcon: ({ color }) => <CheckSquare size={20} color={color} /> }} />
      <Tabs.Screen name="team" options={{ title: 'Team', tabBarIcon: ({ color }) => <Users size={20} color={color} /> }} />
    </Tabs>
  );
}
