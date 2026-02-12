# Development Environments

This project is designed for mutually-exclusive usage between:

- `opencode` on Linux workstation
- `antigravity` on Mac Mini M4

Only one environment should be active per working copy at a time.

## Switch Active Environment

Run one of the following commands from the repository root:

```bash
bash scripts/switch-environment.sh opencode
bash scripts/switch-environment.sh antigravity
```

This writes `.dev-environment.local` (gitignored) with the active profile.

## Recommended Workflow Across Machines

1. Commit and push before switching machines.
2. On the target machine, pull latest changes.
3. Set active environment with the switch script.
4. Run setup checks:

   ```bash
   npm ci
   npm run build
   ```

## Why Mutually Exclusive

Keeping a single active environment avoids conflicting local tool state, local caches, and hidden machine-specific assumptions.
