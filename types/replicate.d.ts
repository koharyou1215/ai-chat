// Minimal custom type declarations for the "replicate" package
// If official types are published, remove this file and install them instead.

declare module 'replicate' {
  interface ReplicateOptions {
    auth: string;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type InputOptions = Record<string, any>;

  class Replicate {
    constructor(options: ReplicateOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    run<T = any>(model: string, options: { input: InputOptions }): Promise<T>;
  }

  export default Replicate;
} 