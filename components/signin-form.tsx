"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { supabase } from "@/lib/supabase"

export function SignInForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email"))
    const password = String(formData.get("password"))
    const fullName = String(formData.get("name") ?? "")

    if (authMode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setIsSubmitting(false)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success("Signed in successfully!")
      router.push("/")
      return
    }

    // --- SIGN UP FLOW ---
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) {
      setIsSubmitting(false)
      toast.error(error.message)
      return
    }

    // Try to insert profile row — if profiles table doesn't exist yet, we warn but don't block
    if (data?.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          full_name: fullName,
          email,
          role: "client",
        })

      if (profileError) {
        // Profile insert failed (e.g. table missing) — auth was still created, inform user
        console.warn("Profile insert warning:", profileError.message)
      }
    }

    setIsSubmitting(false)

    if (!data.session) {
      // Email confirmation required
      toast.success("Account created! Check your email to confirm your address, then sign in.")
      setAuthMode("signin")
      return
    }

    toast.success("Account created successfully!")
    router.push("/")
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Dynamic Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          {authMode === "signin" ? "Welcome back" : "Create an Account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {authMode === "signin"
            ? "Sign in to manage your bookings and tours."
            : "Sign up to start booking your unforgettable memories."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm"
      >
        <FieldGroup>
          {authMode === "signup" && (
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input id="name" name="name" type="text" placeholder="Juan Dela Cruz" required />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </Field>

          <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : authMode === "signin" ? "Sign In" : "Sign Up"}
          </Button>

          <FieldDescription className="text-center mt-4">
            {authMode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
              className="font-medium text-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              {authMode === "signin" ? "Create an account" : "Sign in here"}
            </button>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  )
}