"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Supabase's raw auth error messages aren't great to show directly — map
 * the common ones to something a user can actually act on. */
function friendlyAuthError(err: unknown): string {
  if (!(err instanceof Error)) return "Something went wrong.";
  const message = err.message;
  const status = (err as { status?: number }).status;

  if (status === 429 || /rate limit/i.test(message)) {
    return "Too many attempts in a row — wait a few minutes and try again.";
  }
  if (/invalid login credentials/i.test(message)) {
    return "Incorrect email or password.";
  }
  if (/already registered/i.test(message)) {
    return "An account with this email already exists — try logging in instead.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Confirm your email first — check your inbox for the link.";
  }
  if (/unable to validate email/i.test(message) || /email.*invalid/i.test(message)) {
    return "That email address doesn't look valid.";
  }
  if (/password should be at least/i.test(message)) {
    return "Password needs to be at least 6 characters.";
  }
  return message;
}

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.replace("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          setCheckEmail(true);
        } else {
          router.replace("/");
          router.refresh();
        }
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (checkEmail) {
    return (
      <div className="glass w-full max-w-sm rounded-2xl border border-border/60 p-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand/10">
          <Sparkles className="size-5 text-brand" />
        </div>
        <p className="font-medium">Check your email</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a confirmation link to {email}. Confirm it, then come back
          and log in.
        </p>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => {
            setCheckEmail(false);
            setMode("login");
          }}
        >
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <div className="glass w-full max-w-sm rounded-2xl border border-border/60 p-6">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
          <Sparkles className="size-5" />
        </div>
        <h1 className="text-lg font-semibold">Liner</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "login" ? "Log in to your account" : "Create an account"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full gap-1.5" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {mode === "login" ? "Log in" : "Sign up"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          className="font-medium text-brand hover:underline"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
        >
          {mode === "login" ? "Sign up" : "Log in"}
        </button>
      </p>
    </div>
  );
}
