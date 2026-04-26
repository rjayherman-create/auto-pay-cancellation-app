import React, { useState } from "react";
import AuthForm from "./AuthForm";
import { authAPI } from "../services/api";

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (email: string, password: string, signup: boolean, name?: string) => {
    setError("");
    setLoading(true);

    try {
      // Validation
      if (!email || !password) {
        setError("Email and password are required");
        setLoading(false);
        return;
      }

      if (signup && !name) {
        setError("Name is required for sign up");
        setLoading(false);
        return;
      }

      if (signup) {
        // Only one signup path - using authAPI.register
        try {
          const response = await authAPI.register({
            email,
            password,
            name: name!,
            role: 'designer',
          });

          // Store token and user
          localStorage.setItem('cardhugs_token', response.token);
          localStorage.setItem('cardhugs_user', JSON.stringify(response.user));

          // Redirect to home
          window.location.href = "/";
        } catch (registerError: any) {
          const msg = registerError?.response?.data?.error || "Registration failed";
          setError(msg);
        }
      } else {
        // Login existing user
        const success = await onLogin(email, password);
        if (!success) {
          setError("Invalid email or password");
        }
      }
    } catch (err: any) {
      setError("Authentication failed");
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-800">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">CardHugs</h1>
            <p className="text-gray-600 mt-2">Admin Studio</p>
          </div>

          <AuthForm
            onAuth={handleAuth}
            isSignup={isSignup}
            toggleMode={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
            error={error}
            loading={loading}
          />
        </div>

        <div className="mt-8 text-center text-sm text-indigo-100">
          <p>Demo Credentials:</p>
          <p className="font-mono mt-1 text-indigo-50">admin@cardhugs.com / password123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
