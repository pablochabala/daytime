"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon, LockKeyIcon, WarningCircleIcon } from "./icons";
import { Button, Field } from "./ui";

function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Field id={id} label={label} required type={show ? "text" : "password"} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} error={error} hint={hint} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-1 top-[30px] grid size-11 place-items-center rounded-md text-text-muted hover:text-text"
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
      >
        {show ? <EyeSlashIcon className="size-5" aria-hidden /> : <EyeIcon className="size-5" aria-hidden />}
      </button>
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl border-2 border-error p-3 text-sm font-semibold text-error">
      <WarningCircleIcon weight="fill" className="mt-0.5 size-5 shrink-0" aria-hidden /> {message}
    </p>
  );
}

/** Sign-in for partners and the master account. The server decides where each role lands. */
export function LoginForm({ heading, intro }: { heading: string; intro: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't sign in. Try again.");
        setLoading(false);
        return;
      }
      router.push(data.redirect);
      router.refresh();
    } catch {
      setError("We couldn't reach Daytime. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <span className="grid size-12 place-items-center rounded-2xl bg-secondary-soft text-secondary">
        <LockKeyIcon weight="bold" className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-3xl font-semibold text-secondary">{heading}</h1>
      <p className="mt-1 text-text-muted">{intro}</p>
      <form noValidate onSubmit={submit} className="mt-6 space-y-4">
        <FormError message={error} />
        <Field id="l-email" label="Email" type="email" required autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField id="l-password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>
    </div>
  );
}

/** One-time setup for the master control account. */
export function AdminSetupForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const local: Record<string, string | undefined> = {
      name: !f.name.trim() ? "Enter your name" : undefined,
      email: !/^\S+@\S+\.\S+$/.test(f.email) ? "Enter an email like name@example.com" : undefined,
      password: f.password.length < 12 ? "Use at least 12 characters for the master account" : !/[a-zA-Z]/.test(f.password) || !/\d/.test(f.password) ? "Use letters and at least one number" : undefined,
      confirm: f.confirm !== f.password ? "Passwords don't match" : undefined,
    };
    setErrors(local);
    const first = Object.keys(local).find((k) => local[k]);
    if (first) {
      document.getElementById(`s-${first}`)?.focus();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name, email: f.email, password: f.password }) });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setError(data.error ?? "Couldn't create the account.");
        setLoading(false);
        return;
      }
      router.push(data.redirect);
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <LockKeyIcon weight="bold" className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-3xl font-semibold text-secondary">Create the master account</h1>
      <p className="mt-1 text-text-muted">
        This account controls every partner listing on Daytime. It can only be created once: after this, the setup page locks. Use a strong password you don&apos;t use anywhere else.
      </p>
      <form noValidate onSubmit={submit} className="mt-6 space-y-4">
        <FormError message={error} />
        <Field id="s-name" label="Your name" required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errors.name} />
        <Field id="s-email" label="Email" type="email" required autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={errors.email} />
        <PasswordField id="s-password" label="Password" value={f.password} onChange={(v) => setF({ ...f, password: v })} error={errors.password} hint="At least 12 characters, with letters and a number" autoComplete="new-password" />
        <PasswordField id="s-confirm" label="Confirm password" value={f.confirm} onChange={(v) => setF({ ...f, confirm: v })} error={errors.confirm} autoComplete="new-password" />
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Create master account
        </Button>
      </form>
    </div>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
