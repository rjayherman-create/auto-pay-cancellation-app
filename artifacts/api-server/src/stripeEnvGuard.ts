/**
 * Resolves the webhook domain that will be passed to runStripeSyncInit() for
 * Stripe initialization, based on the Railway environment guard introduced in
 * task-13.
 *
 * Rules:
 *   - Production Railway service (RAILWAY_ENVIRONMENT === "production" or unset)
 *     → prefer APP_DOMAIN (stable custom domain), fall back to
 *       RAILWAY_PUBLIC_DOMAIN.  A missing RAILWAY_ENVIRONMENT is treated as
 *       production so that non-Railway hosts (VMs, containers, etc.) also
 *       register the webhook.
 *   - Preview / staging Railway service (any other RAILWAY_ENVIRONMENT value)
 *     → use RAILWAY_PUBLIC_DOMAIN only — NEVER APP_DOMAIN.  This is the
 *       critical safety property: preview deploys must never overwrite the
 *       production webhook registered at APP_DOMAIN.  If RAILWAY_PUBLIC_DOMAIN
 *       is also absent, return undefined so that runStripeSyncInit() skips
 *       webhook registration for that preview instance.
 *
 * Accepting env as an explicit parameter (rather than reading process.env
 * directly) makes the function purely deterministic and trivially testable.
 */
export function resolveRailwayWebhookDomain(env: NodeJS.ProcessEnv): string | undefined {
  const railwayEnv = env.RAILWAY_ENVIRONMENT;
  const isRailwayProduction = !railwayEnv || railwayEnv === "production";

  if (isRailwayProduction) {
    return env.APP_DOMAIN || env.RAILWAY_PUBLIC_DOMAIN || undefined;
  }

  // Preview / staging: use the ephemeral Railway public domain for this
  // specific deploy.  APP_DOMAIN must never be used here — it belongs to the
  // production service and must remain untouched by preview deploys.
  return env.RAILWAY_PUBLIC_DOMAIN || undefined;
}
