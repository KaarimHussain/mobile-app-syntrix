import { useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { ClipboardList, User, Calendar, CheckSquare, Info } from 'lucide-react-native';
import { Chip, ClayButton, ClayCard, ClayInput, EmptyState, Screen, SectionHeader } from '@/components/clay';
import { useAuth } from '@/lib/auth';
import { actions, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme-context';
import { Task } from '@/lib/types';
import { useToast } from '@/components/Toast';

const taskTone = { pending: 'neutral', in_progress: 'warning', completed: 'success' } as const;

export default function OwnerTasks() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { show } = useToast();
  const { tasks, users, properties } = useStore();
  const employees = users.filter((u) => u.role === 'employee');

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Task['type']>('visit');
  const [assignee, setAssignee] = useState(employees[0]?._id ?? '');
  const [days, setDays] = useState('2');

  // Detail Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const submit = async () => {
    if (!title.trim()) {
      show('Task title is required.', 'error');
      return;
    }
    if (!assignee) {
      show('Please select an assignee.', 'error');
      return;
    }
    const daysNum = Number(days.replace(/[^0-9]/g, ''));
    if (!daysNum || daysNum <= 0) {
      show('Please enter a valid positive number of days.', 'error');
      return;
    }
    await actions.addTask({
      title: title.trim(),
      type,
      assignedTo: assignee,
      assignedBy: user!._id,
      dueDate: new Date(Date.now() + daysNum * 86400000).toISOString(),
    });
    show('Task assigned successfully', 'success');
    setTitle('');
    setShowForm(false);
  };

  const selectedProp = selectedTask ? properties.find((p) => p._id === selectedTask.propertyId) : null;
  const selectedEmp = selectedTask ? users.find((u) => u._id === selectedTask.assignedTo) : null;
  const selectedOverdue = selectedTask && selectedTask.status !== 'completed' && new Date(selectedTask.dueDate) < new Date();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <SectionHeader
          title={`Tasks (${tasks.length})`}
          right={<ClayButton title="+ Assign" onPress={() => setShowForm(true)} style={{ paddingVertical: 8, paddingHorizontal: 14 }} />}
        />
        {tasks.length === 0 ? (
          <EmptyState icon={ClipboardList} message="No tasks yet — assign one to your team." />
        ) : (
          <View style={{ gap: 12 }}>
            {tasks.map((t) => {
              const emp = users.find((u) => u._id === t.assignedTo);
              const prop = properties.find((p) => p._id === t.propertyId);
              const overdue = t.status !== 'completed' && new Date(t.dueDate) < new Date();
              return (
                <ClayCard key={t._id} onPress={() => setSelectedTask(t)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 15, flex: 1, paddingRight: 8 }}>{t.title}</Text>
                    <Chip label={t.status.replace('_', ' ')} tone={taskTone[t.status]} />
                  </View>
                  <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 4 }}>
                    {emp?.name} · {t.type.replace('_', ' ')}{prop ? ` · ${prop.location}` : ''}
                  </Text>
                  <Text style={{ color: overdue ? theme.danger : theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 4 }}>
                    Due {new Date(t.dueDate).toLocaleDateString()} {overdue ? '· overdue' : ''}
                  </Text>
                </ClayCard>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Assign Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 }}>
            <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 18, marginBottom: 14 }}>Assign task</Text>
            <ClayInput label="Title" value={title} onChangeText={setTitle} placeholder="Client visit — Clifton apartment" />
            <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-SemiBold', fontSize: 13, marginBottom: 6 }}>Type</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {(['visit', 'follow_up', 'other'] as Task['type'][]).map((t) => (
                <ClayButton key={t} title={t.replace('_', ' ')} variant={type === t ? 'primary' : 'ghost'} onPress={() => setType(t)} style={{ flex: 1, paddingVertical: 9 }} />
              ))}
            </View>
            <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-SemiBold', fontSize: 13, marginBottom: 6 }}>Assign to</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {employees.map((e) => (
                <ClayButton key={e._id} title={e.name.split(' ')[0]} variant={assignee === e._id ? 'primary' : 'ghost'} onPress={() => setAssignee(e._id)} style={{ paddingVertical: 9, paddingHorizontal: 14 }} />
              ))}
            </View>
            <ClayInput label="Due in (days)" value={days} onChangeText={setDays} keyboardType="numeric" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ClayButton title="Cancel" variant="ghost" onPress={() => setShowForm(false)} style={{ flex: 1 }} />
              <ClayButton title="Assign" onPress={submit} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Details View Modal */}
      <Modal visible={!!selectedTask} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 }}>
            {selectedTask && (
              <View style={{ gap: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 20, flex: 1, marginRight: 12 }}>{selectedTask.title}</Text>
                  <Chip label={selectedTask.status.replace('_', ' ')} tone={taskTone[selectedTask.status]} />
                </View>

                {/* Details list */}
                <View style={{ gap: 12, backgroundColor: theme.surfaceAlt, padding: 14, borderRadius: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Info size={16} color={theme.textSecondary} />
                    <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Regular', fontSize: 14 }}>
                      Type: <Text style={{ fontFamily: 'Inter-SemiBold' }}>{selectedTask.type.replace('_', ' ')}</Text>
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <User size={16} color={theme.textSecondary} />
                    <View>
                      <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Regular', fontSize: 14 }}>
                        Assigned To: <Text style={{ fontFamily: 'Inter-SemiBold' }}>{selectedEmp?.name || 'Unknown'}</Text>
                      </Text>
                      {selectedEmp && (
                        <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 12 }}>
                          {selectedEmp.phone} · {selectedEmp.email}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Calendar size={16} color={theme.textSecondary} />
                    <Text style={{ color: selectedOverdue ? theme.danger : theme.textPrimary, fontFamily: 'Inter-Regular', fontSize: 14 }}>
                      Due Date: <Text style={{ fontFamily: 'Inter-SemiBold' }}>{new Date(selectedTask.dueDate).toLocaleDateString()}</Text>
                      {selectedOverdue ? ' (Overdue)' : ''}
                    </Text>
                  </View>
                </View>

                {/* Property Detail */}
                {selectedProp && (
                  <View style={{ borderWidth: 1, borderColor: theme.border, padding: 14, borderRadius: 12 }}>
                    <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-SemiBold', fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>Related Property</Text>
                    <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 15 }}>{selectedProp.title}</Text>
                    <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 2 }}>{selectedProp.location}</Text>
                  </View>
                )}

                <ClayButton title="Close" onPress={() => setSelectedTask(null)} />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
