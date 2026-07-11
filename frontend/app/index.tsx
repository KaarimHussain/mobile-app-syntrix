import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function Index() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Redirect href="/login" />;
  return <Redirect href={user.role === 'employee' ? '/(employee)' : '/(owner)'} />;
}
