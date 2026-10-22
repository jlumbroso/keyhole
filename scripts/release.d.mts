// Types for the tests (src/test/release.test.ts); the logic is in release.mjs.
export interface Step { name: string; state: 'ok' | 'done' | 'acted' | 'would' | 'pending' | 'stop'; detail: string }
export interface World {
  say?(name: string, state: string, detail: string): void;
  sleep(ms: number): Promise<void>;
  preconditions(version: string): Promise<{ what: string; ok: boolean; detail?: string }[]>;
  headSha(): Promise<string>;
  remoteTag(tag: string): Promise<string | null>;
  sameContent(tagSha: string, head: string): Promise<boolean>;
  ci(sha: string): Promise<'green' | 'pending' | 'red' | 'none'>;
  createTag(tag: string, sha: string): Promise<void>;
  githubRelease(tag: string): Promise<{ assets: string[] } | null>;
  releaseRun(tag: string): Promise<{ status: string; conclusion?: string; url?: string } | null>;
  openVsxRun(tag: string): Promise<{ status: string; conclusion?: string; url?: string } | null>;
  openVsxVersion(): Promise<string | null>;
  marketplaceVersion(): Promise<string | null>;
  downloadVsix(tag: string): Promise<string>;
  publishMarketplace(file: string): Promise<{ ok?: boolean; alreadyPublished?: boolean; error?: string }>;
  publishOpenVsxWithToken(file: string): Promise<{ ok?: boolean; alreadyPublished?: boolean; error?: string }>;
}
export function release(world: World, options: { version: string; dryRun?: boolean; ovsxFallback?: boolean; polls?: number; pollMs?: number }): Promise<{ ok: boolean; steps: Step[] }>;
export function realWorld(): World;
