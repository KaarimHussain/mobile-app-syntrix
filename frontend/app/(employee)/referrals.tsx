import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { Chip, ClayButton, ClayCard, ClayInput, EmptyState, formatPKR, Screen, SectionHeader } from '@/components/clay';
import { config } from '@/lib/config';
import { useAuth } from '@/lib/auth';
import { actions, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme-context';
import { useToast } from '@/components/Toast';

export default function Referrals() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { show } = useToast();
  const { properties, deals } = useStore();

  const [propertyId, setPropertyId] = useState<string>('');
  const [source, setSource] = useState<'direct_owner' | 'agent'>('direct_owner');
  const [agentName, setAgentName] = useState('');
  const [negotiated, setNegotiated] = useState('');
  const [final, setFinal] = useState('');
  const [rate, setRate] = useState(String(config.defaultCommissionRate));

  const myDeals = deals.filter((d) => d.employeeId === user?._id);
  const num = (s: string) => Number(s.replace(/[^0-9.]/g, ''));

  const submit = async () => {
    if (!propertyId) {
      show('Please select a property.', 'error');
      return;
    }
    const negotiatedVal = num(negotiated);
    if (!negotiatedVal || negotiatedVal <= 0) {
      show('Please enter a valid negotiated price.', 'error');
      return;
    }
    const finalVal = num(final);
    if (!finalVal || finalVal <= 0) {
      show('Please enter a valid final price.', 'error');
      return;
    }
    if (source === 'agent' && !agentName.trim()) {
      show('Agent name is required for agent-sourced deals.', 'error');
      return;
    }
    const rateVal = num(rate);
    if (rateVal < 0 || rateVal > 100) {
      show('Commission rate must be between 0% and 100%.', 'error');
      return;
    }

    await actions.logDeal({
      propertyId,
      employeeId: user!._id,
      source,
      agentName: source === 'agent' ? agentName.trim() : undefined,
      negotiatedPrice: negotiatedVal,
      finalPrice: finalVal,
      commissionRate: rateVal || undefined,
    });
    
    setPropertyId(''); setAgentName(''); setNegotiated(''); setFinal('');
    show(
      config.requireOwnerApproval
        ? 'Deal logged — sent to owner for approval'
        : 'Deal logged and approved successfully',
      'success'
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <SectionHeader title="Log a deal / referral" />
        <ClayCard>
          <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-SemiBold', fontSize: 13, marginBottom: 6 }}>Property</Text>
          <View style={{ gap: 8, marginBottom: 12 }}>
            {properties.map((p) => (
              <ClayButton
                key={p._id}
                title={p.title}
                variant={propertyId === p._id ? 'primary' : 'ghost'}
                onPress={() => setPropertyId(p._id)}
                style={{ paddingVertical: 9 }}
              />
            ))}
          </View>
          <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-SemiBold', fontSize: 13, marginBottom: 6 }}>Source</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <ClayButton title="Direct owner" variant={source === 'direct_owner' ? 'primary' : 'ghost'} onPress={() => setSource('direct_owner')} style={{ flex: 1 }} />
            <ClayButton title="Agent" variant={source === 'agent' ? 'primary' : 'ghost'} onPress={() => setSource('agent')} style={{ flex: 1 }} />
          </View>
          {source === 'agent' && (
            <ClayInput label="Agent name" value={agentName} onChangeText={setAgentName} placeholder="Faisal Estate" />
          )}
          <ClayInput label="Negotiated price (PKR)" value={negotiated} onChangeText={setNegotiated} keyboardType="numeric" />
          <ClayInput label="Final price (PKR)" value={final} onChangeText={setFinal} keyboardType="numeric" />
          <ClayInput label={`Commission rate % (default ${config.defaultCommissionRate})`} value={rate} onChangeText={setRate} keyboardType="numeric" />
          <ClayButton title="Submit deal" onPress={submit} />
        </ClayCard>

        <SectionHeader title={`My submissions (${myDeals.length})`} />
        <View style={{ gap: 12 }}>
          {myDeals.length === 0 ? (
            <EmptyState icon={Inbox} message="No deals logged yet." />
          ) : (
            myDeals.map((d) => {
              const prop = properties.find((p) => p._id === d.propertyId);
              return (
                <ClayCard key={d._id}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 15, flex: 1, paddingRight: 8 }}>{prop?.title}</Text>
                    <Chip
                      label={d.approvalStatus}
                      tone={d.approvalStatus === 'approved' ? 'success' : d.approvalStatus === 'rejected' ? 'danger' : 'warning'}
                    />
                  </View>
                  <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 4 }}>
                    {formatPKR(d.finalPrice)} · commission {formatPKR(d.commissionAmount)}
                  </Text>
                </ClayCard>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
