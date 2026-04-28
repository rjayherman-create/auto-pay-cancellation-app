import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { healthCheck } from "@workspace/api-client-react";
import { StartingUpController, ServiceStartingBanner } from "../lib/use-starting-up";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderController(qc?: QueryClient) {
  const client = qc ?? makeQueryClient();
  const result = render(
    <QueryClientProvider client={client}>
      <StartingUpController />
    </QueryClientProvider>,
  );
  return { client, ...result };
}

function make503Response(retryAfter: number) {
  return new Response(JSON.stringify({ error: "starting up" }), {
    status: 503,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfter),
    },
  });
}

function make200Response() {
  return new Response(
    JSON.stringify({ status: "ok", dbReady: true, uptime: 1, timestamp: new Date().toISOString() }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

describe("ServiceStartingBanner (unit)", () => {
  it("renders the countdown message with the given secondsLeft", () => {
    render(<ServiceStartingBanner secondsLeft={5} />);
    expect(screen.getByText(/Service is starting up/i)).toBeInTheDocument();
    expect(screen.getByText("5s")).toBeInTheDocument();
  });
});

describe("StartingUpController – 503 cold-start flow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("banner is not shown before any API call is made", () => {
    renderController();
    expect(screen.queryByText(/Service is starting up/i)).not.toBeInTheDocument();
  });

  it("shows the banner when the API returns 503 with Retry-After: 2 (via real customFetch path)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(make503Response(2));

    renderController();

    expect(screen.queryByText(/Service is starting up/i)).not.toBeInTheDocument();

    await act(async () => {
      await healthCheck().catch(() => {});
    });

    expect(screen.getByText(/Service is starting up/i)).toBeInTheDocument();
    expect(screen.getByText("2s")).toBeInTheDocument();
  });

  it("counts down and hides the banner once the countdown expires", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(make503Response(2));

    const qc = makeQueryClient();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    renderController(qc);

    await act(async () => {
      await healthCheck().catch(() => {});
    });

    expect(screen.getByText("2s")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("1s")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText(/Service is starting up/i)).not.toBeInTheDocument();
    expect(invalidateSpy).toHaveBeenCalledOnce();
  });

  it("a successful API response immediately dismisses the banner (causal, timer not yet expired)", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(make503Response(10))
      .mockResolvedValueOnce(make200Response());

    renderController();

    await act(async () => {
      await healthCheck().catch(() => {});
    });

    expect(screen.getByText(/Service is starting up/i)).toBeInTheDocument();
    expect(screen.getByText("10s")).toBeInTheDocument();

    await act(async () => {
      await healthCheck().catch(() => {});
    });

    expect(screen.queryByText(/Service is starting up/i)).not.toBeInTheDocument();
  });

  it("banner stays hidden when the API returns 200 (no 503 emitted)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(make200Response());

    renderController();

    await act(async () => {
      await healthCheck().catch(() => {});
    });

    expect(screen.queryByText(/Service is starting up/i)).not.toBeInTheDocument();
  });

  it("full cold-start sequence: 503 shows the banner; countdown expires; 200 retry keeps it hidden", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(make503Response(2))
      .mockResolvedValueOnce(make200Response());

    const qc = makeQueryClient();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    renderController(qc);

    await act(async () => {
      await healthCheck().catch(() => {});
    });

    expect(screen.getByText(/Service is starting up/i)).toBeInTheDocument();
    expect(screen.getByText("2s")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("1s")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText(/Service is starting up/i)).not.toBeInTheDocument();
    expect(invalidateSpy).toHaveBeenCalledOnce();

    await act(async () => {
      await healthCheck().catch(() => {});
    });

    expect(screen.queryByText(/Service is starting up/i)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
