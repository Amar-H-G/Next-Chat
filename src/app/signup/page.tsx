"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { validateName, validateEmail, validatePassword } from "@/utils/validation";

export default function SignupPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    router.replace("/chat");
    return null;
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const nameErr = validateName(name);
    if (nameErr) newErrors.name = nameErr;
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
      await register(email.trim(), password, name.trim());
      router.replace("/chat");
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      if (raw.includes("already") || raw.includes("409")) {
        setGeneralError("An account with this email already exists. Please sign in.");
      } else if (raw.includes("network") || raw.includes("fetch")) {
        setGeneralError("Network error. Check your connection and try again.");
      } else {
        setGeneralError("Registration failed. Please try again.");
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

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join NexChat and start messaging</p>

        {generalError && (
          <div className="error-alert" role="alert">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="signup-name" className="field-label">
              Full Name
            </label>
            <input
              id="signup-name"
              type="text"
              className={`field-input ${errors.name ? "field-input-error" : ""}`}
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: "" }));
              }}
              autoComplete="name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <span id="name-error" className="field-error" role="alert">
                {errors.name}
              </span>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="signup-email" className="field-label">
              Email
            </label>
            <input
              id="signup-email"
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
            <label htmlFor="signup-password" className="field-label">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              className={`field-input ${errors.password ? "field-input-error" : ""}`}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => ({ ...p, password: "" }));
              }}
              autoComplete="new-password"
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
            id="signup-submit-btn"
            type="submit"
            className="btn-primary"
            disabled={submitting}
            style={{ marginTop: "0.75rem" }}
          >
            {submitting ? (
              <span className="btn-loading">
                <span className="btn-spinner" />
                Creating account…
              </span>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account?{" "}
          <button
            id="goto-login-btn"
            className="auth-switch-link"
            onClick={() => router.push("/login")}
            type="button"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
