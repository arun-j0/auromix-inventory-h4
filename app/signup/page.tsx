import { SignUpForm } from "@/components/auth/signup-form"

export default function SignUp() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
      <div className="w-full max-w-md p-8 space-y-8 bg-background rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Auromix</h1>
          <p className="text-muted-foreground mt-2">Create a new account</p>
        </div>
        <SignUpForm />
      </div>
    </div>
  )
}
