import { useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { Moon, Sun, LogOut, Inbox, Bell, Calendar, User, Info } from 'lucide-react-native';
import { Avatar, Chip, ClayButton, ClayCard, EmptyState, IconButton, Screen, SectionHeader } from '@/components/clay';
import { useAuth } from '@/lib/auth';
import { actions, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme-context';
import { Task } from '@/lib/types';
import { useToast } from '@/components/Toast';

const taskTone = { pending: 'neutral', in_progress: 'warning', completed: 'success' } as const;

export default function MyTasks() {
  const { theme, toggle, mode } = useTheme();
  const { user, logout } = useAuth();
  const { show } = useToast();
  const { tasks, properties, notifications, users } = useStore();
  
  const mine = tasks.filter((t) => t.assignedTo === user?._id);
  const open = mine.filter((t) => t.status !== 'completed');
  const done = mine.filter((t) => t.status === 'completed');
  const myNotifs = notifications.filter((n) => n.userId === user?._id && !n.read);

  // Detail Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleStartTask = async (taskId: string) => {
    await actions.setTaskStatus(taskId, 'in_progress');
    show('Task marked as in progress', 'success');
    setSelectedTask(null);
  };

  const handleCompleteTask = async (taskId: string) => {
    await actions.setTaskStatus(taskId, 'completed');
    show('Task marked as completed', 'success');
    setSelectedTask(null);
  };

  const handleMarkNotificationsRead = async () => {
    await actions.markNotificationsRead(user!._id);
    show('Notifications marked as read', 'info');
  };

  const selectedProp = selectedTask ? properties.find((p) => p._id === selectedTask.propertyId) : null;
  const selectedCreator = selectedTask ? users.find((u) => u._id === selectedTask.assignedBy) : null;
  const selectedOverdue = selectedTask && selectedTask.status !== 'completed' && new Date(selectedTask.dueDate) < new Date();

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

        {myNotifs.length > 0 && (
          <ClayCard style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Bell size={16} color={theme.primary} />
                <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold' }}>Notifications ({myNotifs.length})</Text>
              </View>
              <ClayButton title="Mark read" variant="ghost" onPress={handleMarkNotificationsRead} style={{ paddingVertical: 6, paddingHorizontal: 10 }} />
            </View>
            {myNotifs.slice(0, 5).map((n) => (
              <Text key={n._id} style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 6 }}>
                • {n.message}
              </Text>
            ))}
          </ClayCard>
        )}

        <SectionHeader title={`Open tasks (${open.length})`} />
        {open.length === 0 ? (
          <EmptyState icon={Inbox} message="Nothing pending — great work!" />
        ) : (
          <View style={{ gap: 12 }}>
            {open.map((t) => {
              const prop = properties.find((p) => p._id === t.propertyId);
              const overdue = new Date(t.dueDate) < new Date();
              return (
                <ClayCard key={t._id} onPress={() => setSelectedTask(t)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 15, flex: 1, paddingRight: 8 }}>{t.title}</Text>
                    <Chip label={t.status.replace('_', ' ')} tone={taskTone[t.status]} />
                  </View>
                  <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 4 }}>
                    {t.type.replace('_', ' ')}{prop ? ` · ${prop.location}` : ''}
                  </Text>
                  <Text style={{ color: overdue ? theme.danger : theme.textSecondary, fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 2 }}>
                    Due {new Date(t.dueDate).toLocaleDateString()} {overdue ? '· overdue' : ''}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    {t.status === 'pending' && (
                      <ClayButton title="Start" variant="ghost" onPress={() => handleStartTask(t._id)} style={{ flex: 1 }} />
                    )}
                    <ClayButton title="Complete" onPress={() => handleCompleteTask(t._id)} style={{ flex: 1 }} />
                  </View>
                </ClayCard>
              );
            })}
          </View>
        )}

        {done.length > 0 && (
          <>
            <SectionHeader title={`Completed (${done.length})`} />
            <View style={{ gap: 12 }}>
              {done.map((t) => (
                <ClayCard key={t._id} style={{ opacity: 0.7 }} onPress={() => setSelectedTask(t)}>
                  <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-SemiBold' }}>{t.title}</Text>
                </ClayCard>
              ))}
            </View>
          </>
        )}
      </ScrollView>

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

                {/* Details List */}
                <View style={{ gap: 12, backgroundColor: theme.surfaceAlt, padding: 14, borderRadius: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Info size={16} color={theme.textSecondary} />
                    <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Regular', fontSize: 14 }}>
                      Type: <Text style={{ fontFamily: 'Inter-SemiBold' }}>{selectedTask.type.replace('_', ' ')}</Text>
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <User size={16} color={theme.textSecondary} />
                    <Text style={{ color: theme.textPrimary, fontFamily: 'Inter-Regular', fontSize: 14 }}>
                      Assigned By: <Text style={{ fontFamily: 'Inter-SemiBold' }}>{selectedCreator?.name || 'Owner'}</Text>
                    </Text>
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

                {/* Action Buttons within Details Modal */}
                {selectedTask.status !== 'completed' && (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {selectedTask.status === 'pending' && (
                      <ClayButton title="Start Task" variant="ghost" onPress={() => handleStartTask(selectedTask._id)} style={{ flex: 1 }} />
                    )}
                    <ClayButton title="Complete Task" onPress={() => handleCompleteTask(selectedTask._id)} style={{ flex: 1 }} />
                  </View>
                )}

                <ClayButton title="Close" variant={selectedTask.status === 'completed' ? 'primary' : 'ghost'} onPress={() => setSelectedTask(null)} />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
