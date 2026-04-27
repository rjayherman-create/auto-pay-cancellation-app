import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth as useClerkAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { usePlaidLink } from "react-plaid-link";
import { toast } from "sonner";

const API_BASE = "/api";

interface PlaidLinkButtonProps {
  onSuccess: () => void;
  onStart?: () => void;
  onEnd?: () => void;
  label?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function PlaidLinkButton({
  onSuccess,
  onStart,
  onEnd,
  label = "Connect Bank Account",
  className,
  size = "default",
}: PlaidLinkButtonProps) {
  const { getToken } = useClerkAuth();

  const authFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = await getToken();
    return fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> || {}),
      },
    });
  }, [getToken]);

  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [loadingToken, setLoadingToken] = useState(false);
  const connectingRef = useRef(false);

  const createLinkToken = async () => {
    setLoadingToken(true);
    try {
      const res = await authFetch("/plaid/create-link-token", { method: "POST" });
      const data = (await res.json()) as any;
      if (data.link_token) {
        setDemoMode(data.demo_mode || false);
        setLinkToken(data.link_token);
      } else {
        toast.error("Failed to start bank connection.");
      }
    } catch {
      toast.error("Connection error. Please try again.");
    } finally {
      setLoadingToken(false);
    }
  };

  const handleDemoConnect = async () => {
    onStart?.();
    try {
      const res = await authFetch("/plaid/exchange-token", {
        method: "POST",
        body: JSON.stringify({ public_token: "demo-link-token" }),
      });
      const data = (await res.json()) as any;
      if (data.success) {
        toast.success("Demo bank connected! 5 sample subscriptions detected.");
        onSuccess();
      }
    } catch {
      toast.error("Demo connection failed.");
    } finally {
      onEnd?.();
      setLinkToken(null);
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken || "",
    onSuccess: async (public_token, metadata) => {
      onStart?.();
      try {
        const res = await authFetch("/plaid/exchange-token", {
          method: "POST",
          body: JSON.stringify({
            public_token,
            institution_name: metadata.institution?.name,
          }),
        });
        const data = (await res.json()) as any;
        if (data.success) {
          toast.success(
            `Connected! Found ${data.recurringCount ?? "some"} recurring payment${
              data.recurringCount !== 1 ? "s" : ""
            }.`
          );
          onSuccess();
        } else {
          toast.error(data.message || "Failed to connect account.");
        }
      } catch {
        toast.error("Failed to sync bank data.");
      } finally {
        onEnd?.();
        setLinkToken(null);
      }
    },
    onExit: () => {
      onEnd?.();
      setLinkToken(null);
    },
  });

  useEffect(() => {
    if (!linkToken || connectingRef.current) return;
    if (demoMode) {
      connectingRef.current = true;
      handleDemoConnect().finally(() => {
        connectingRef.current = false;
      });
    } else if (ready) {
      open();
    }
  }, [linkToken, demoMode, ready]);

  const handleClick = async () => {
    if (!linkToken) {
      await createLinkToken();
    } else if (demoMode) {
      handleDemoConnect();
    } else if (ready) {
      open();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loadingToken}
      size={size}
      className={className}
    >
      {loadingToken ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Plus className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
