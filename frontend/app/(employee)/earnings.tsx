import { ScrollView, Text, View } from 'react-native';
import { DollarSign, Wallet, CheckSquare, TrendingUp, Inbox } from 'lucide-react-native';
import { Chip, ClayCard, EmptyState, formatPKR, Screen, SectionHeader, StatCard } from '@/components/clay';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme-context';

export default function Earnings() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { deals, tasks, properties } = useStore();

  const myDeals = deals.filter((d) => d.employeeId === user?._id);
  const approved = myDeals.filter((d) => d.approvalStatus === 'approved');
  const total = approved.reduce((s, d) => s + d.commissionAmount, 0);
  const paid = approved.filter((d) => d.paymentStatus === 'paid').reduce((s, d) => s + d.commissionAmount, 0);
  const myTasks = tasks.filter((t) => t.assignedTo === user?._id);
  const doneRate = myTasks.length
    ? Math.round((myTasks.filter((t) => t.status === 'completed').length / myTasks.length) * 100)
    : 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
          <StatCard icon={DollarSign} label="Total commission" value={formatPKR(total)} hint="approved deals" />
          <StatCard icon={Wallet} label="Received" value={formatPKR(paid)} />
          <StatCard icon={CheckSquare} label="Deals closed" value={String(approved.length)} />
          <StatCard icon={TrendingUp} label="Task completion" value={`${doneRate}%`} />
        </View>

        <SectionHeader title="Commission by deal" />
        {approved.length === 0 ? (
          <EmptyState icon={Inbox} message="No approved deals yet — your commissions will show here." />
        ) : (
          <View style={{ gap: 12 }}>
            {approved.map((d) => {
              const prop = properties.find((p) => p._id === d.propertyId);
              return (
                <ClayCard key={d._id}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 15, flex: 1, paddingRight: 8 }}>{prop?.title}</Text>
                    <Chip label={d.paymentStatus} tone={d.paymentStatus === 'paid' ? 'success' : d.paymentStatus === 'partial' ? 'warning' : 'neutral'} />
                  </View>
                  <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 4 }}>
                    Deal {formatPKR(d.finalPrice)} · rate {d.commissionRate}%
                  </Text>
                  <Text style={{ color: theme.primary, fontFamily: 'Inter-ExtraBold', fontSize: 17, marginTop: 6 }}>
                    {formatPKR(d.commissionAmount)}
                  </Text>
                </ClayCard>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
