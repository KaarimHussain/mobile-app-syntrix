import { ScrollView, Text, View } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { Chip, ClayButton, ClayCard, EmptyState, formatPKR, Screen, SectionHeader } from '@/components/clay';
import { actions, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme-context';
import { Deal } from '@/lib/types';
import { useToast } from '@/components/Toast';

const approvalTone = { pending: 'warning', approved: 'success', rejected: 'danger' } as const;
const paymentTone = { pending: 'neutral', partial: 'warning', paid: 'success' } as const;

export default function OwnerDeals() {
  const { theme } = useTheme();
  const { show } = useToast();
  const { deals, properties, users } = useStore();

  const handleSetPaymentStatus = async (dealId: string, status: Deal['paymentStatus']) => {
    await actions.setDealPaymentStatus(dealId, status);
    show(`Payment status updated to ${status}`, 'success');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <SectionHeader title={`Deal records (${deals.length})`} />
        {deals.length === 0 ? (
          <EmptyState icon={Inbox} message="No deals logged yet." />
        ) : (
          <View style={{ gap: 12 }}>
            {deals.map((d) => {
              const prop = properties.find((p) => p._id === d.propertyId);
              const emp = users.find((u) => u._id === d.employeeId);
              return (
                <ClayCard key={d._id}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 16, flex: 1, paddingRight: 8 }}>
                      {prop?.title ?? 'Unknown property'}
                    </Text>
                    <Chip label={d.approvalStatus} tone={approvalTone[d.approvalStatus]} />
                  </View>
                  <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 4 }}>
                    {emp?.name} · {d.source === 'agent' ? `Agent-sourced (${d.agentName})` : 'Direct owner'}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <View>
                      <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 12 }}>Negotiated → Final</Text>
                      <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-SemiBold', fontSize: 14 }}>
                        {formatPKR(d.negotiatedPrice)} → {formatPKR(d.finalPrice)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 12 }}>Commission ({d.commissionRate}%)</Text>
                      <Text style={{ color: theme.primary, fontFamily: 'Inter-Bold', fontSize: 14 }}>{formatPKR(d.commissionAmount)}</Text>
                    </View>
                  </View>
                  <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label={`payment: ${d.paymentStatus}`} tone={paymentTone[d.paymentStatus]} />
                  </View>
                  {d.approvalStatus === 'approved' && (
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, alignItems: 'center' }}>
                      <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 12, marginRight: 2 }}>Payment:</Text>
                      {(['pending', 'partial', 'paid'] as const).map((st) => (
                        <ClayButton
                          key={st}
                          title={st}
                          variant={d.paymentStatus === st ? 'primary' : 'ghost'}
                          onPress={() => handleSetPaymentStatus(d._id, st)}
                          style={{ flex: 1, paddingVertical: 7, paddingHorizontal: 6 }}
                        />
                      ))}
                    </View>
                  )}
                </ClayCard>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
