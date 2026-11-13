import { StyleSheet, Text } from "react-native";

export function RoleBadge({ name, accent }: { name: string; accent: string }) {
  return <Text style={[styles.pill, { backgroundColor: accent }]}>{name}</Text>;
}

const styles = StyleSheet.create({
  pill: {
    color: "white",
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontWeight: "600",
  },
});
