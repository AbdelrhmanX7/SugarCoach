"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import NextLink from "next/link";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          "Oops! That didn't work. Please check your email and password and try again.",
        );

        return;
      }

      // Full page navigation to ensure cookies are sent to middleware
      window.location.href = "/chat";
    } catch {
      setError("Something went wrong. Please try again in a moment!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="flex flex-col items-center gap-1 pb-0 pt-6">
        <h2 className="text-2xl font-bold text-foreground">Welcome Back!</h2>
        <p className="text-sm text-default-500">
          Sign in to continue your journey
        </p>
      </CardHeader>
      <CardBody className="px-6 py-6">
        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <Input
            isRequired
            label="Email"
            placeholder="you@example.com"
            type="email"
            value={email}
            variant="bordered"
            onValueChange={setEmail}
          />
          <Input
            isRequired
            label="Password"
            placeholder="Enter your password"
            type="password"
            value={password}
            variant="bordered"
            onValueChange={setPassword}
          />

          {error && (
            <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Button
            className="mt-2 font-semibold"
            color="primary"
            isLoading={loading}
            size="lg"
            type="submit"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-default-500">
          Don&apos;t have an account?{" "}
          <Link as={NextLink} href="/register" size="sm">
            Create one here
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
