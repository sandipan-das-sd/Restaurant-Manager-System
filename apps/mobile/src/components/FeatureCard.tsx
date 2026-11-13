import { Pressable, StyleSheet, Text } from "react-native";
import type { DashboardFeature } from "@shared";
import { theme } from "../config/theme";

export function FeatureCard({
  feature,
  selected,
  onSelect,
}: {
  feature: DashboardFeature;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={[styles.card, !feature.allowed && styles.locked, selected && styles.selected]}
    >
      <Text style={styles.state}>{feature.allowed ? "Open" : "Closed"}</Text>
      <Text style={styles.title}>{feature.title}</Text>
      <Text style={styles.summary}>{feature.summary}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  locked: { backgroundColor: "transparent" },
  selected: { borderColor: theme.ink, borderWidth: 2 },
  state: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", color: theme.muted },
  title: { marginTop: 6, fontSize: 18, fontWeight: "600", color: theme.ink },
  summary: { marginTop: 4, color: theme.muted },
});
