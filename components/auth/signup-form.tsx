"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { signUp } from "@/lib/firebase/auth"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserRole } from "@/types/user"

export function SignUpForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<UserRole>("INTERNAL_EMPLOYEE")
  const [referenceId, setReferenceId] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both passwords are the same.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    // Validate contractor reference ID
    if (role === "CONTRACTOR" && !referenceId.trim()) {
      toast({
        title: "Reference ID Required",
        description: "Please provide an employee or admin reference ID.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      await signUp({
        name,
        email,
        password,
        phone,
        role,
        referenceId: role === "CONTRACTOR" ? referenceId : undefined,
      })

      toast({
        title: "Account created",
        description: "Your account has been created successfully.",
      })

      router.push("/")
    } catch (error: any) {
      console.error("Signup error:", error)
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="Enter your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
          <SelectTrigger>
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INTERNAL_EMPLOYEE">Internal Employee</SelectItem>
            <SelectItem value="CONTRACTOR">Contractor</SelectItem>
            <SelectItem value="ADMIN">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {role === "CONTRACTOR" && (
        <div className="space-y-2">
          <Label htmlFor="referenceId">Employee/Admin Reference ID</Label>
          <Input
            id="referenceId"
            type="text"
            placeholder="Enter reference ID"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Please provide the ID of the employee or admin who referred you.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <LoadingSpinner size="sm" /> : "Sign Up"}
      </Button>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  )
}
