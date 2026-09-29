"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { validateEmail, validatePassword } from "@/utils/validation";

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  if (!loading && user) {
    router.replace("/chat");
    return null;
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;
    const pwErr = validatePassword(password);
    if (pwErr) newErrors.password = pwErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/chat");
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      // Normalise Appwrite error messages for users
      if (raw.includes("Invalid credentials") || raw.includes("401")) {
        setGeneralError("Incorrect email or password. Please try again.");
      } else if (raw.includes("network") || raw.includes("fetch")) {
        setGeneralError("Network error. Check your connection and try again.");
      } else {
        setGeneralError("Sign in failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💬</div>
          <span className="auth-brand">NexChat</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue chatting</p>

        {generalError && (
          <div className="error-alert" role="alert">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="login-email" className="field-label">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className={`field-input ${errors.email ? "field-input-error" : ""}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: "" }));
              }}
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <span id="email-error" className="field-error" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="login-password" className="field-label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className={`field-input ${errors.password ? "field-input-error" : ""}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => ({ ...p, password: "" }));
              }}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "pw-error" : undefined}
            />
            {errors.password && (
              <span id="pw-error" className="field-error" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn-primary"
            disabled={submitting}
            style={{ marginTop: "0.75rem" }}
          >
            {submitting ? (
              <span className="btn-loading">
                <span className="btn-spinner" />
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="auth-switch">
          Don&apos;t have an account?{" "}
          <button
            id="goto-signup-btn"
            className="auth-switch-link"
            onClick={() => router.push("/signup")}
            type="button"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
