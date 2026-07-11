import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions } from 'react-native';
import { AlertCircle, CheckCircle, Info } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  show: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const timerRef = useRef<any>(null);

  const show = (message: string, type: ToastType = 'info') => {
    // Clear previous timeout if exists
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({
      id: Date.now().toString(),
      message,
      type,
    });

    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(50);

    // Slide and fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 3 seconds
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 30,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToast(null);
      });
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.toastCard,
              toast.type === 'success' && styles.success,
              toast.type === 'error' && styles.error,
              toast.type === 'info' && styles.info,
            ]}
          >
            {toast.type === 'success' && <CheckCircle size={20} color="#22C55E" />}
            {toast.type === 'error' && <AlertCircle size={20} color="#EF4444" />}
            {toast.type === 'info' && <Info size={20} color="#3B82F6" />}
            
            <Text style={styles.messageText}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    maxWidth: width - 40,
    width: '100%',
  },
  success: {
    borderColor: 'rgba(34, 197, 94, 0.4)',
    backgroundColor: '#0F172A',
  },
  error: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: '#0F172A',
  },
  info: {
    borderColor: 'rgba(59, 130, 246, 0.4)',
    backgroundColor: '#0F172A',
  },
  messageText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
});
