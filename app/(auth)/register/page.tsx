"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Select, SelectItem } from "@heroui/select";
import NextLink from "next/link";

import { createClient } from "@/lib/supabase/client";

const diabetesTypes = [
  { key: "type1", label: "Type 1" },
  { key: "type2", label: "Type 2" },
  { key: "gestational", label: "Gestational" },
  { key: "prediabetes", label: "Prediabetes" },
];

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [diabetesType, setDiabetesType] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match. Give it another try!");

      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");

      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(
          "We couldn't create your account. Please try a different email or try again later.",
        );

        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          display_name: displayName,
          diabetes_type: diabetesType || null,
          date_of_birth: dateOfBirth || null,
        });

        if (profileError) {
          // eslint-disable-next-line no-console
          console.error("Profile creation error:", profileError);
        }
      }

      // If session exists (auto-confirmed, e.g. local dev), redirect directly
      if (data.session) {
        window.location.href = "/chat";

        return;
      }

      // Otherwise show confirmation email message
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again in a moment!");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full shadow-lg">
        <CardBody className="flex flex-col items-center gap-4 px-6 py-10">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold text-foreground">
            You&apos;re All Set!
          </h2>
          <p className="text-center text-default-500">
            We&apos;ve sent a confirmation email to <strong>{email}</strong>.
            Check your inbox and click the link to get started!
          </p>
          <Button
            as={NextLink}
            className="mt-2"
            color="primary"
            href="/login"
            variant="flat"
          >
            Go to Login
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="flex flex-col items-center gap-1 pb-0 pt-6">
        <h2 className="text-2xl font-bold text-foreground">Join SugarCoach!</h2>
        <p className="text-sm text-default-500">
          Let&apos;s set up your account and start your journey
        </p>
      </CardHeader>
      <CardBody className="px-6 py-6">
        <form className="flex flex-col gap-4" onSubmit={handleRegister}>
          <Input
            isRequired
            label="Display Name"
            placeholder="What should we call you?"
            value={displayName}
            variant="bordered"
            onValueChange={setDisplayName}
          />
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
            placeholder="At least 6 characters"
            type="password"
            value={password}
            variant="bordered"
            onValueChange={setPassword}
          />
          <Input
            isRequired
            label="Confirm Password"
            placeholder="Type your password again"
            type="password"
            value={confirmPassword}
            variant="bordered"
            onValueChange={setConfirmPassword}
          />
          <Select
            label="Diabetes Type"
            placeholder="Select your diabetes type"
            selectedKeys={diabetesType ? [diabetesType] : []}
            variant="bordered"
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];

              setDiabetesType(selected ? String(selected) : "");
            }}
          >
            {diabetesTypes.map((type) => (
              <SelectItem key={type.key}>{type.label}</SelectItem>
            ))}
          </Select>
          <Input
            label="Date of Birth"
            placeholder="Select your date of birth"
            type="date"
            value={dateOfBirth}
            variant="bordered"
            onValueChange={setDateOfBirth}
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
            {loading ? "Creating your account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-default-500">
          Already have an account?{" "}
          <Link as={NextLink} href="/login" size="sm">
            Sign in here
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
