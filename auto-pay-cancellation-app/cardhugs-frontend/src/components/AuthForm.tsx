import React, { useState } from "react";
import { Loader } from "lucide-react";

interface AuthFormProps {
  onAuth: (email: string, password: string, isSignup: boolean, name?: string) => void;
  isSignup: boolean;
  toggleMode: () => void;
  error: string;
  loading?: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuth, isSignup, toggleMode, error, loading = false }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    // Client-side validation
    if (!email) {
      setLocalError("Email is required");
      return;
    }
    if (!password) {
      setLocalError("Password is required");
      return;
    }
    if (isSignup && !name) {
      setLocalError("Name is required");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    onAuth(email, password, isSignup, name);
  };

  const displayError = error || localError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
        {isSignup ? "Create Account" : "Sign In"}
      </h2>

      {displayError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {displayError}
        </div>
      )}

      {isSignup && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />
        </div>
      )}

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Email Address</label>
        <input
          type="email"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          minLength={6}
          required
        />
        {isSignup && (
          <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader className="w-4 h-4 animate-spin" />}
        {loading ? (isSignup ? "Creating account..." : "Signing in...") : (isSignup ? "Create Account" : "Sign In")}
      </button>

      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <button
            type="button"
            className="text-indigo-600 hover:text-indigo-700 font-medium ml-1 transition"
            onClick={toggleMode}
            disabled={loading}
          >
            {isSignup ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </form>
  );
};

export default AuthForm;
