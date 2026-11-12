type Fetch = typeof fetch;
type FetchInput = Parameters<Fetch>[0];
type FetchInit = Parameters<Fetch>[1];

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD']);

function requestMethod(input: FetchInput, init?: FetchInit): string {
  if (init?.method) return init.method.toUpperCase();
  return input instanceof Request ? input.method.toUpperCase() : 'GET';
}

function requestUrl(input: FetchInput): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function displayUrl(url: string): string {
  return url.split('?')[0] ?? url;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface HttpOptions {
  fetchImpl?: Fetch;
  timeoutMs?: number;
  retries?: number;
  baseDelayMs?: number;
}

export function createHttpFetch(options: HttpOptions = {}): Fetch {
  const fetchImpl = options.fetchImpl;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const retries = options.retries ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 200;

  return async (input, init) => {
    const method = requestMethod(input, init);
    const url = requestUrl(input);
    const logUrl = displayUrl(url);
    const attempts = IDEMPOTENT_METHODS.has(method) ? retries + 1 : 1;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const controller = new AbortController();
      if (init?.signal?.aborted) controller.abort(init.signal.reason);
      const onAbort = () => controller.abort(init?.signal?.reason);
      init?.signal?.addEventListener('abort', onAbort, { once: true });
      const timer = setTimeout(() => controller.abort(new Error('HTTP timeout')), timeoutMs);
      const startedAt = Date.now();

      try {
        const response = await (fetchImpl ?? fetch)(input, { ...init, signal: controller.signal });
        console.info(
          `[api] ${method} ${logUrl} -> ${response.status} (${Date.now() - startedAt}ms, attempt ${attempt}/${attempts})`,
        );

        if (attempt < attempts && RETRYABLE_STATUS.has(response.status)) {
          if (response.body) await response.body.cancel();
          await wait(baseDelayMs * 2 ** (attempt - 1));
          continue;
        }

        return response;
      } catch (error) {
        console.warn(
          `[api] ${method} ${logUrl} failed after ${Date.now() - startedAt}ms (attempt ${attempt}/${attempts}): ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
        if (init?.signal?.aborted || attempt === attempts) throw error;
        await wait(baseDelayMs * 2 ** (attempt - 1));
      } finally {
        clearTimeout(timer);
        init?.signal?.removeEventListener('abort', onAbort);
      }
    }

    throw new Error('HTTP request failed');
  };
}

export const httpFetch = createHttpFetch();
