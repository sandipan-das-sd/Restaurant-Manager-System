import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { APP_NAME, DEMO_ACCOUNTS, DEMO_PASSWORD, roleByKey } from "@shared";
import { ApiError } from "../../config/api";
import { useAuth } from "./AuthProvider";

export function LoginScreen() {
  const { user, ready, signIn } = useAuth();
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (ready && user) return <Navigate to="/" replace />;

  async function submit(nextEmail: string, nextPassword: string) {
    setError(null);
    setPending(true);
    try {
      await signIn(nextEmail, nextPassword);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Sign-in failed. Try again.");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(email, password);
  }

  return (
    <main className="login">
      <section className="brand">
        <p className="eyebrow">Staff desk</p>
        <div>
          <h1>{APP_NAME}</h1>
          <p className="lede">Sign in. The desk opens with your role.</p>
        </div>
        <p className="fine">Demo only. Same desks on web and mobile.</p>
      </section>
      <section className="panel">
        <form onSubmit={onSubmit} className="form">
          <h2>Sign in</h2>
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="primary" disabled={pending || !ready}>
            {pending ? "Opening…" : "Enter the desk"}
          </button>
        </form>
        <div className="roles">
          <p>Or open a demo role. Password for each is {DEMO_PASSWORD}.</p>
          <div className="role-grid">
            {DEMO_ACCOUNTS.map((account) => {
              const role = roleByKey(account.role);
              return (
                <button
                  key={account.email}
                  type="button"
                  className="role-chip"
                  style={{ borderColor: role.accent }}
                  disabled={pending || !ready}
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(DEMO_PASSWORD);
                    void submit(account.email, DEMO_PASSWORD);
                  }}
                >
                  <span className="dot" style={{ background: role.accent }} />
                  {role.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
