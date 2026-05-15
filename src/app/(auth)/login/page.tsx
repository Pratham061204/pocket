"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithDemo, signInWithMagicLink } from "@/actions/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithMagicLink(email);
      setSent(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-black text-white text-xl font-bold mb-3">
            P
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pocket</h1>
          <p className="text-sm text-gray-500 mt-1">Split expenses, settle simply.</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Sign in</CardTitle>
            <CardDescription>Continue to your groups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Demo Account */}
            <form action={signInWithDemo}>
              <Button type="submit" variant="outline" className="w-full gap-2">
                Try Demo Account
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">or</span>
              </div>
            </div>

            {/* Magic Link */}
            {sent ? (
              <div className="text-center py-4">
                <p className="text-sm font-medium text-gray-900">Check your email</p>
                <p className="text-sm text-gray-500 mt-1">
                  We sent a magic link to <strong>{email}</strong>
                </p>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending…" : "Send magic link"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
