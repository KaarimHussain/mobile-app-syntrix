import { ScrollView, Text, View } from 'react-native';
import { Users, DollarSign } from 'lucide-react-native';
import { Chip, ClayCard, formatPKR, Screen, SectionHeader, StatCard } from '@/components/clay';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme-context';

export default function OwnerTeam() {
  const { theme } = useTheme();
  const { users, deals, tasks } = useStore();
  const employees = users.filter((u) => u.role === 'employee');
  const approved = deals.filter((d) => d.approvalStatus === 'approved');
  const totalCommission = approved.reduce((s, d) => s + d.commissionAmount, 0);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <StatCard icon={Users} label="Employees" value={String(employees.length)} />
          <StatCard icon={DollarSign} label="Total commissions" value={formatPKR(totalCommission)} hint="approved deals" />
        </View>

        <SectionHeader title="Employee directory" />
        <View style={{ gap: 12 }}>
          {employees.map((u) => {
            const myDeals = approved.filter((d) => d.employeeId === u._id);
            const myTasks = tasks.filter((t) => t.assignedTo === u._id);
            const done = myTasks.filter((t) => t.status === 'completed').length;
            const rate = myTasks.length ? Math.round((done / myTasks.length) * 100) : 0;
            const earned = myDeals.reduce((s, d) => s + d.commissionAmount, 0);
            const revenue = myDeals.reduce((s, d) => s + d.finalPrice, 0);
            return (
              <ClayCard key={u._id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 15 }}>{u.name}</Text>
                  <Chip label={u.active ? 'active' : 'inactive'} tone={u.active ? 'success' : 'neutral'} />
                </View>
                <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 2 }}>
                  {u.email} · {u.phone}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  <View>
                    <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 12 }}>Deals closed</Text>
                    <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 14 }}>{myDeals.length}</Text>
                  </View>
                  <View>
                    <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 12 }}>Revenue</Text>
                    <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 14 }}>{formatPKR(revenue)}</Text>
                  </View>
                  <View>
                    <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 12 }}>Tasks done</Text>
                    <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 14 }}>{rate}%</Text>
                  </View>
                  <View>
                    <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 12 }}>Commission</Text>
                    <Text style={{ color: theme.primary, fontFamily: 'Inter-Bold', fontSize: 14 }}>{formatPKR(earned)}</Text>
                  </View>
                </View>
              </ClayCard>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
