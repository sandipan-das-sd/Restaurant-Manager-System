import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { APP_NAME } from "@shared";
import { theme } from "../../config/theme";

export function SignupScreen({ onSignIn, onBack }: { onSignIn: () => void; onBack: () => void }) {
  const [sent, setSent] = useState(false);

  return (
    <View style={styles.page}>
      <Pressable onPress={onBack}>
        <Text style={styles.back}>Back to home</Text>
      </Pressable>
      <Text style={styles.eyebrow}>New staff</Text>
      <Text style={styles.title}>{APP_NAME}</Text>
      <Text style={styles.lede}>Create an account. This screen is prepared.</Text>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} />
      <Text style={styles.label}>Email</Text>
      <TextInput autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      <Text style={styles.label}>Password</Text>
      <TextInput secureTextEntry style={styles.input} />
      {sent ? (
        <Text style={styles.note}>
          Sign-up is prepared. This demo opens the staff accounts already on the desk. Use Sign in.
        </Text>
      ) : null}
      <Pressable style={styles.primary} onPress={() => setSent(true)}>
        <Text style={styles.primaryText}>Create account</Text>
      </Pressable>
      <Pressable onPress={onSignIn}>
        <Text style={styles.link}>Already on the desk? Sign in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.paper, padding: 24, paddingTop: 56 },
  back: { color: theme.muted, marginBottom: 18 },
  eyebrow: { color: theme.muted, fontSize: 13 },
  title: { marginTop: 8, color: theme.ink, fontSize: 32, lineHeight: 36, fontWeight: "600" },
  lede: { marginTop: 8, color: theme.muted, fontSize: 16 },
  label: { marginTop: 16, fontWeight: "600", color: theme.ink },
  input: {
    marginTop: 6,
    backgroundColor: theme.card,
    borderColor: theme.line,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.ink,
  },
  note: { marginTop: 14, color: theme.ink },
  primary: {
    marginTop: 18,
    backgroundColor: theme.ink,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: theme.cream, fontWeight: "600" },
  link: { marginTop: 16, color: theme.ink, fontWeight: "600" },
});
