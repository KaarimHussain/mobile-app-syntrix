import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Inbox, Search } from 'lucide-react-native';
import { Chip, ClayButton, ClayCard, EmptyState, ClayInput, formatPKR, Screen, SectionHeader } from '@/components/clay';
import { useAuth } from '@/lib/auth';
import { actions, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme-context';
import { PropertyStatus } from '@/lib/types';
import { useToast } from '@/components/Toast';

const statusTone = { available: 'primary', rented: 'warning', sold: 'success' } as const;

export default function EmployeeProperties() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { show } = useToast();
  const { properties } = useStore();
  const [queuedIds, setQueuedIds] = useState<string[]>([]);
  
  // Filtration state
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'rent' | 'sale'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | PropertyStatus>('all');

  const mine = properties.filter((p) => p.assignedEmployeeId === user?._id);

  const request = async (propertyId: string, status: PropertyStatus) => {
    const res = await actions.updatePropertyStatus(propertyId, status, user!._id);
    if (res?.queued) {
      setQueuedIds((ids) => [...ids, propertyId]);
      show('Status change request sent to owner for approval.', 'info');
    } else {
      show(`Property status updated to ${status}`, 'success');
    }
  };

  // Filter properties
  const filteredProperties = mine.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || p.type === filterType;
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <SectionHeader title={`My properties (${mine.length})`} />

        {/* Filter Card */}
        <ClayCard style={{ marginBottom: 16, padding: 12 }}>
          <ClayInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by title or location..."
            style={{ marginBottom: 8 }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 13, fontFamily: 'Inter-SemiBold' }}>Type:</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['all', 'rent', 'sale'] as const).map((t) => (
                <ClayButton
                  key={t}
                  title={t}
                  variant={filterType === t ? 'primary' : 'ghost'}
                  onPress={() => setFilterType(t)}
                  style={{ paddingVertical: 5, paddingHorizontal: 10 }}
                />
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: theme.textSecondary, fontSize: 13, fontFamily: 'Inter-SemiBold' }}>Status:</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['all', 'available', 'rented', 'sold'] as const).map((s) => (
                <ClayButton
                  key={s}
                  title={s}
                  variant={filterStatus === s ? 'primary' : 'ghost'}
                  onPress={() => setFilterStatus(s)}
                  style={{ paddingVertical: 5, paddingHorizontal: 10 }}
                />
              ))}
            </View>
          </View>
        </ClayCard>

        {mine.length === 0 ? (
          <EmptyState icon={Inbox} message="No properties assigned to you yet." />
        ) : filteredProperties.length === 0 ? (
          <EmptyState icon={Search} message="No properties match your filters." />
        ) : (
          <View style={{ gap: 12 }}>
            {filteredProperties.map((p) => (
              <ClayCard key={p._id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 16, flex: 1, paddingRight: 8 }}>{p.title}</Text>
                  <Chip label={p.status} tone={statusTone[p.status]} />
                </View>
                <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 4 }}>
                  {p.location} · {p.type === 'rent' ? 'For rent' : 'For sale'} · {formatPKR(p.askingPrice)}
                </Text>
                {queuedIds.includes(p._id) ? (
                  <Text style={{ color: theme.warning, fontFamily: 'Inter-SemiBold', fontSize: 12, marginTop: 8 }}>
                    Status change sent to owner for approval.
                  </Text>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    {(['available', 'rented', 'sold'] as PropertyStatus[])
                      .filter((s) => s !== p.status)
                      .map((s) => (
                        <ClayButton key={s} title={`Mark ${s}`} variant="ghost" onPress={() => request(p._id, s)} style={{ flex: 1, paddingVertical: 9 }} />
                      ))}
                  </View>
                )}
              </ClayCard>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
