import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FileQuestion } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <FileQuestion size={48} color={Colors.textTertiary} />
        </View>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.subtitle}>The page you are looking for does not exist.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/')} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Go back home</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: Colors.surface, padding: 32 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.surfaceAlt, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: 28, textAlign: 'center' as const, lineHeight: 22 },
  button: { paddingVertical: 14, paddingHorizontal: 32, backgroundColor: Colors.primary, borderRadius: 14 },
  buttonText: { color: Colors.textInverse, fontSize: 16, fontWeight: '600' as const },
});
