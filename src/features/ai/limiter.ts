/**
 * Keeps one server instance from firing a burst of calls at Google at the same moment.
 * Bursts are what trigger 429 and 503 on a single key. Extra calls wait their turn in a short queue.
 * If the wait is too long the call fails fast, instead of leaving the student staring at a spinner.
 */
export class Limiter {
  private running = 0;
  private waiting: Array<() => void> = [];

  constructor(
    private readonly maxConcurrent: number,
    private readonly maxWaitMs: number,
  ) {}

  async run<T>(job: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await job();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      const turn = () => {
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(() => {
        this.waiting = this.waiting.filter((entry) => entry !== turn);
        reject(Object.assign(new Error("429 rate limit: local queue is full"), { status: 429 }));
      }, this.maxWaitMs);
      this.waiting.push(turn);
    });
  }

  private release() {
    const next = this.waiting.shift();
    if (next) next(); // the slot passes straight to the next call
    else this.running--;
  }
}

/** One shared limiter for every Gemini call made by this server instance. */
export const geminiLimiter = new Limiter(6, 8_000);
