// Minimal ambient declaration for `process.env.NODE_ENV`, the only Node
// global this browser-facing library ever references (dev-only warning
// guards in Button.tsx/Icon.tsx — see the `typeof process` runtime guard
// there and CLAUDE.md's "Building and previewing UI work" section for why
// it's guarded). Deliberately not @types/node, which would pull in the
// full Node API surface for two lines of actual usage this library has no
// other reason to reference.
declare const process: { env?: { NODE_ENV?: string } } | undefined;
