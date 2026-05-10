# trackmanager-lib

## TypeScript configuration

Two tsconfig files exist at the root:

- **`tsconfig.json`** — project references entry point for the monorepo. It has `"files": []` and delegates to each package and to `tsconfig.node.json` via `references`. VS Code and `tsc --build` use this as the workspace root.
- **`tsconfig.node.json`** — covers root-level Node/tooling config files (`eslint.config.ts`, `vitest.config.ts`) that are not part of any package. Without it, the TypeScript language server cannot resolve module types for ESLint and Vitest plugins in those files.
