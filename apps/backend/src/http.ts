type Fetch = typeof fetch;
type FetchInput = Parameters<Fetch>[0];
type FetchInit = Parameters<Fetch>[1];

export interface HttpClientOptions {
  fetchImpl?: Fetch;
  timeoutMs?: number;
  retries?: number;
  baseDelayMs?: number;
}

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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Single outbound HTTP path: per-attempt timeout, bounded retries with
 * exponential backoff for idempotent requests, and status/duration logging.
 * Headers and bodies are never logged.
 */
export function createHttpClient(options: HttpClientOptions = {}): Fetch {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const retries = options.retries ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 200;

  return async (input, init) => {
    const method = requestMethod(input, init);
    const url = requestUrl(input);
    const logUrl = url.split('?')[0] ?? url;
    const attempts = IDEMPOTENT_METHODS.has(method) ? retries + 1 : 1;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const timeout = new AbortController();
      const timer = setTimeout(() => timeout.abort(new Error('HTTP timeout')), timeoutMs);
      timer.unref();
      const signal = init?.signal ? AbortSignal.any([init.signal, timeout.signal]) : timeout.signal;
      const startedAt = Date.now();

      try {
        const response = await fetchImpl(input, { ...init, signal });
        console.info(
          `[http] ${method} ${logUrl} -> ${response.status} (${Date.now() - startedAt}ms, attempt ${attempt}/${attempts})`,
        );

        if (attempt < attempts && RETRYABLE_STATUS.has(response.status)) {
          if (response.body) await response.body.cancel();
          clearTimeout(timer);
          await wait(baseDelayMs * 2 ** (attempt - 1));
          continue;
        }

        // The body is still unread here: keep this attempt's timeout and the
        // caller's abort live so both continue to apply while the consumer
        // streams the body. Clearing them now would orphan the response.
        if (response.body === null) clearTimeout(timer);
        return response;
      } catch (error) {
        clearTimeout(timer);
        console.warn(
          `[http] ${method} ${logUrl} failed after ${Date.now() - startedAt}ms (attempt ${attempt}/${attempts}): ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
        if (init?.signal?.aborted || attempt === attempts) throw error;
        await wait(baseDelayMs * 2 ** (attempt - 1));
      }
    }

    throw new Error('HTTP request failed');
  };
}

export const httpFetch = createHttpClient();
