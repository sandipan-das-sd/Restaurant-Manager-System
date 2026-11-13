import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../config/theme";

export function AppHeader({ onSignOut }: { onSignOut: () => void }) {
  return (
    <View style={styles.bar}>
      <Text style={styles.title}>Restaurant Manager System</Text>
      <Pressable onPress={onSignOut} style={styles.button}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: theme.ink,
    paddingTop: 64,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: theme.cream, fontSize: 16, fontWeight: "600", flex: 1, marginRight: 12 },
  button: { borderColor: "#8a8076", borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  buttonText: { color: theme.cream, fontWeight: "600" },
});
