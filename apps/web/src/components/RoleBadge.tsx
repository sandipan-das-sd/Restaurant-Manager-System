export function RoleBadge({ name, accent }: { name: string; accent: string }) {
  return (
    <span className="role-pill" style={{ background: accent }}>
      {name}
    </span>
  );
}
