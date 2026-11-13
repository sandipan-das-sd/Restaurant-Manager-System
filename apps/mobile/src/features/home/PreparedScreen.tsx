import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../config/theme";

export function PreparedScreen({
  title,
  lede,
  rows,
}: {
  title: string;
  lede: string;
  rows: Array<{ title: string; note: string }>;
}) {
  return (
    <View style={styles.page}>
      <Text style={styles.eyebrow}>Prepared</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.lede}>{lede}</Text>
      {rows.map((row) => (
        <View key={row.title} style={styles.row}>
          <Text style={styles.rowTitle}>{row.title}</Text>
          <Text style={styles.note}>{row.note}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.paper, padding: 24, paddingTop: 64, gap: 10 },
  eyebrow: { color: theme.muted, fontSize: 13 },
  title: { color: theme.ink, fontSize: 36, lineHeight: 40, fontWeight: "600" },
  lede: { color: theme.muted, fontSize: 16, marginBottom: 8 },
  row: {
    backgroundColor: theme.card,
    borderColor: theme.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  rowTitle: { color: theme.ink, fontWeight: "600" },
  note: { color: theme.muted },
});
