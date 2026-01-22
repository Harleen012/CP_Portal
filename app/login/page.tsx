"use client";

import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/lib/msalConfig";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { instance } = useMsal();
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await instance.loginPopup(loginRequest);
      router.push("/dashboard");
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl border border-border">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-1">
            Sign in using Microsoft Entra ID
          </p>
        </div>

        {/* Microsoft Login */}
        <Button
          onClick={handleLogin}
          className="w-full h-12 text-white rounded-xl font-semibold shadow-lg"
          style={{ backgroundColor: "rgb(19, 127, 236)" }}
        >
          Sign in with Microsoft
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Secured with Microsoft Entra ID
        </div>
      </div>
    </div>
  );
}
