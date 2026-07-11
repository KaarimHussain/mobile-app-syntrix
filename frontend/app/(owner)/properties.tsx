import { useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { Plus, Edit2, Trash2, Home, Search } from 'lucide-react-native';
import {
  Chip,
  ClayButton,
  ClayCard,
  ClayInput,
  formatPKR,
  Screen,
  SectionHeader,
  EmptyState,
} from '@/components/clay';
import { useAuth } from '@/lib/auth';
import { actions, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme-context';
import { Property, PropertyStatus } from '@/lib/types';
import { useToast } from '@/components/Toast';

const statusTone = { available: 'primary', rented: 'warning', sold: 'success' } as const;

export default function OwnerProperties() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { show } = useToast();
  const { properties, users } = useStore();
  
  const [showForm, setShowForm] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<'rent' | 'sale'>('rent');
  const [price, setPrice] = useState('');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>('');

  // Filtration state
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'rent' | 'sale'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | PropertyStatus>('all');

  const employees = users.filter((u) => u.role === 'employee');

  const openAdd = () => {
    setEditingPropertyId(null);
    setTitle('');
    setLocation('');
    setType('rent');
    setPrice('');
    setAssignedEmployeeId('');
    setShowForm(true);
  };

  const openEdit = (p: Property) => {
    setEditingPropertyId(p._id);
    setTitle(p.title);
    setLocation(p.location);
    setType(p.type);
    setPrice(String(p.askingPrice));
    setAssignedEmployeeId(p.assignedEmployeeId || '');
    setShowForm(true);
  };

  const submit = async () => {
    const askingPrice = Number(price.replace(/[^0-9]/g, ''));
    if (!title.trim()) {
      show('Property title is required.', 'error');
      return;
    }
    if (!location.trim()) {
      show('Property location is required.', 'error');
      return;
    }
    if (!askingPrice || askingPrice <= 0) {
      show('Please enter a valid positive price.', 'error');
      return;
    }
    const data = {
      title: title.trim(),
      location: location.trim(),
      type,
      askingPrice,
      assignedEmployeeId: assignedEmployeeId || undefined,
    };
    if (editingPropertyId) {
      await actions.editProperty(editingPropertyId, data);
      show('Property updated successfully', 'success');
    } else {
      await actions.addProperty(data);
      show('Property added successfully', 'success');
    }
    setTitle(''); setLocation(''); setPrice(''); setAssignedEmployeeId('');
    setShowForm(false);
  };

  const handleUpdateStatus = async (propertyId: string, status: PropertyStatus, userId: string) => {
    await actions.updatePropertyStatus(propertyId, status, userId);
    show(`Property status updated to ${status}`, 'success');
  };

  const handleArchive = async (propertyId: string) => {
    await actions.archiveProperty(propertyId);
    show('Property archived successfully', 'success');
  };

  // Filter properties
  const filteredProperties = properties.filter((p) => {
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
        <SectionHeader
          title={`All properties (${properties.length})`}
          right={<ClayButton title="+ Add" onPress={openAdd} style={{ paddingVertical: 8, paddingHorizontal: 14 }} />}
        />

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

        {/* Properties List */}
        {filteredProperties.length === 0 ? (
          <EmptyState icon={Search} message="No properties match your filters." />
        ) : (
          <View style={{ gap: 12 }}>
            {filteredProperties.map((p) => {
              const emp = users.find((u) => u._id === p.assignedEmployeeId);
              return (
                <ClayCard key={p._id}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 16, flex: 1, paddingRight: 8 }}>{p.title}</Text>
                    <Chip label={p.status} tone={statusTone[p.status]} />
                  </View>
                  <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 4 }}>
                    {p.location} · {p.type === 'rent' ? 'For rent' : 'For sale'}
                  </Text>
                  <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 16, marginTop: 6 }}>
                    {formatPKR(p.finalPrice ?? p.askingPrice)}
                    {p.finalPrice ? <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 12 }}>  (asked {formatPKR(p.askingPrice)})</Text> : null}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 4 }}>
                    {emp ? `Assigned: ${emp.name}` : 'Unassigned'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    {(['available', 'rented', 'sold'] as PropertyStatus[])
                      .filter((s) => s !== p.status)
                      .map((s) => (
                        <ClayButton
                          key={s}
                          title={`Mark ${s}`}
                          variant="ghost"
                          onPress={() => handleUpdateStatus(p._id, s, user!._id)}
                          style={{ flex: 1, paddingVertical: 9 }}
                        />
                      ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <ClayButton
                      title="Edit"
                      variant="ghost"
                      onPress={() => openEdit(p)}
                      style={{ flex: 1, paddingVertical: 9 }}
                    />
                    <ClayButton
                      title="Archive"
                      variant="danger"
                      onPress={() => handleArchive(p._id)}
                      style={{ flex: 1, paddingVertical: 9 }}
                    />
                  </View>
                </ClayCard>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* New/Edit Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 }}>
            <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 18, marginBottom: 14 }}>
              {editingPropertyId ? 'Edit property' : 'New property'}
            </Text>
            <ClayInput label="Title" value={title} onChangeText={setTitle} placeholder="3-Bed Apartment, Clifton" />
            <ClayInput label="Location" value={location} onChangeText={setLocation} placeholder="Clifton, Karachi" />
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <ClayButton title="Rent" variant={type === 'rent' ? 'primary' : 'ghost'} onPress={() => setType('rent')} style={{ flex: 1 }} />
              <ClayButton title="Sale" variant={type === 'sale' ? 'primary' : 'ghost'} onPress={() => setType('sale')} style={{ flex: 1 }} />
            </View>
            <ClayInput label="Asking price (PKR)" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="150000" />
            <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-SemiBold', fontSize: 13, marginBottom: 6 }}>Assign employee</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <ClayButton
                title="None"
                variant={assignedEmployeeId === '' ? 'primary' : 'ghost'}
                onPress={() => setAssignedEmployeeId('')}
                style={{ paddingVertical: 9, paddingHorizontal: 14 }}
              />
              {employees.map((e) => (
                <ClayButton
                  key={e._id}
                  title={e.name.split(' ')[0]}
                  variant={assignedEmployeeId === e._id ? 'primary' : 'ghost'}
                  onPress={() => setAssignedEmployeeId(e._id)}
                  style={{ paddingVertical: 9, paddingHorizontal: 14 }}
                />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ClayButton title="Cancel" variant="ghost" onPress={() => setShowForm(false)} style={{ flex: 1 }} />
              <ClayButton title="Save" onPress={submit} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
