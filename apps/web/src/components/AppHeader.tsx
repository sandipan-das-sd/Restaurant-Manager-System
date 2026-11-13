export function AppHeader({ email, onSignOut }: { email?: string; onSignOut: () => void }) {
  return (
    <header className="topbar">
      <strong>Restaurant Manager System</strong>
      <div className="topbar-actions">
        <span>{email}</span>
        <button type="button" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}
