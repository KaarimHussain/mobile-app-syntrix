import { ScrollView, Text, View } from 'react-native';
import { Moon, Sun, LogOut, Home, Key, DollarSign, Award, Inbox } from 'lucide-react-native';
import {
  Avatar,
  Chip,
  ClayButton,
  ClayCard,
  EmptyState,
  formatPKR,
  IconButton,
  Screen,
  SectionHeader,
  StatCard,
} from '@/components/clay';
import { useAuth } from '@/lib/auth';
import { actions, usePendingStatusChanges, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme-context';
import { useToast } from '@/components/Toast';

export default function OwnerDashboard() {
  const { theme, toggle, mode } = useTheme();
  const { user, logout } = useAuth();
  const { show } = useToast();
  const { properties, deals, users, tasks } = useStore();
  const statusChanges = usePendingStatusChanges();

  const pendingDeals = deals.filter((d) => d.approvalStatus === 'pending');
  const approved = deals.filter((d) => d.approvalStatus === 'approved');
  const revenue = approved.reduce((s, d) => s + d.finalPrice, 0);
  const commissions = approved.reduce((s, d) => s + d.commissionAmount, 0);

  const perf = users
    .filter((u) => u.role === 'employee')
    .map((u) => ({
      user: u,
      closed: approved.filter((d) => d.employeeId === u._id).length,
    }))
    .sort((a, b) => b.closed - a.closed);
  const top = perf[0];

  const handleResolveDeal = async (dealId: string, approve: boolean) => {
    await actions.resolveDeal(dealId, approve);
    show(approve ? 'Deal approved successfully' : 'Deal request rejected', approve ? 'success' : 'info');
  };

  const handleResolveStatusChange = async (changeId: string, approve: boolean, userId: string) => {
    await actions.resolveStatusChange(changeId, approve, userId);
    show(approve ? 'Property status change approved' : 'Property status change request rejected', approve ? 'success' : 'info');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <Avatar name={user?.name ?? '?'} />
            <View>
              <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13 }}>Salaam, Welcome back</Text>
              <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 20 }}>
                {user?.name.split(' ')[0]}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton icon={mode === 'light' ? Moon : Sun} onPress={toggle} />
            <IconButton icon={LogOut} onPress={logout} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
          <StatCard icon={Home} label="Properties" value={String(properties.length)} hint={`${properties.filter((p) => p.status === 'available').length} available`} />
          <StatCard icon={Key} label="Rented / Sold" value={`${properties.filter((p) => p.status === 'rented').length} / ${properties.filter((p) => p.status === 'sold').length}`} />
          <StatCard icon={DollarSign} label="Revenue" value={formatPKR(revenue)} hint="Approved deals" />
          <StatCard icon={Award} label="Commissions" value={formatPKR(commissions)} hint={top ? `Top: ${top.user.name}` : undefined} />
        </View>

        <SectionHeader title={`Approvals (${pendingDeals.length + statusChanges.length})`} />
        {pendingDeals.length === 0 && statusChanges.length === 0 ? (
          <EmptyState icon={Inbox} message="No pending approvals. All clear" />
        ) : (
          <View style={{ gap: 12 }}>
            {pendingDeals.map((d) => {
              const prop = properties.find((p) => p._id === d.propertyId);
              const emp = users.find((u) => u._id === d.employeeId);
              return (
                <ClayCard key={d._id}>
                  <Chip label="Deal" tone="primary" />
                  <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 15, marginTop: 8 }}>{prop?.title}</Text>
                  <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 2 }}>
                    {emp?.name} · {formatPKR(d.finalPrice)} · {d.source === 'agent' ? `Agent: ${d.agentName}` : 'Direct owner'}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13 }}>
                    Commission {d.commissionRate}% = {formatPKR(d.commissionAmount)}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <ClayButton title="Approve" onPress={() => handleResolveDeal(d._id, true)} style={{ flex: 1 }} />
                    <ClayButton title="Reject" variant="danger" onPress={() => handleResolveDeal(d._id, false)} style={{ flex: 1 }} />
                  </View>
                </ClayCard>
              );
            })}
            {statusChanges.map((c) => {
              const prop = properties.find((p) => p._id === c.propertyId);
              const emp = users.find((u) => u._id === c.requestedBy);
              return (
                <ClayCard key={c._id}>
                  <Chip label="Status change" tone="warning" />
                  <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 15, marginTop: 8 }}>{prop?.title}</Text>
                  <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 2 }}>
                    {emp?.name} requests: {prop?.status} → {c.requestedStatus}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <ClayButton title="Approve" onPress={() => handleResolveStatusChange(c._id, true, user!._id)} style={{ flex: 1 }} />
                    <ClayButton title="Reject" variant="danger" onPress={() => handleResolveStatusChange(c._id, false, user!._id)} style={{ flex: 1 }} />
                  </View>
                </ClayCard>
              );
            })}
          </View>
        )}

        <SectionHeader title="Team performance" />
        <View style={{ gap: 12 }}>
          {perf.map(({ user: u, closed }) => {
            const open = tasks.filter((t) => t.assignedTo === u._id && t.status !== 'completed').length;
            const earned = approved.filter((d) => d.employeeId === u._id).reduce((s, d) => s + d.commissionAmount, 0);
            return (
              <ClayCard key={u._id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 15 }}>{u.name}</Text>
                  <Chip label={`${closed} closed`} tone={closed > 0 ? 'success' : 'neutral'} />
                </View>
                <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 4 }}>
                  {open} open tasks · earned {formatPKR(earned)}
                </Text>
              </ClayCard>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
