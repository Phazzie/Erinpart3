# Origin CI

GitHub Actions on this account is billing-locked, so it will not run `.github/workflows/ci.yml`. Continuous integration moves to Cursor Origin. Origin runs the Depot app, which executes the GitHub Actions-syntax workflow in `.depot/workflows/ci.yml` on `depot-ubuntu-24.04`. That workflow starts once this repository is detached from GitHub.

`.github/workflows/ci.yml` stays in the tree until that cutover.

## Workflow map

| GitHub Actions | Depot |
| --- | --- |
| File `.github/workflows/ci.yml`, workflow `CI` | File `.depot/workflows/ci.yml`, workflow `CI` |
| On push to `main`, and on pull requests targeting `main` | On every pull request, and on push to `main` |
| Job `build` on `ubuntu-latest` | Job `verify` on `depot-ubuntu-24.04` |
| `actions/checkout@v4` | `actions/checkout@v4` |
| `actions/setup-node@v4` with Node 22 and the npm cache | `actions/setup-node@v4` with Node 22 and the npm cache |
| `npm ci` | `npm ci` |
| `npm run lint` (`tsc --noEmit`) | `npm run lint` |
| `npm run test` (`vitest run`) | `npm run test` |
| No review-script test | `node --test scripts/ai-review.test.mjs` |
| `npm run build:prod` (`ng build --configuration=production`) | `npm run build:prod` |
| `actions/upload-artifact@v4` of `dist/` for 7 days | Dropped |
| No review job | Job `ai-review` on pull requests only. Runs `node scripts/ai-review.mjs` after `npm ci` |

`npm run test` is `vitest run`, so the suite exits when it finishes. The watch script is `npm run test:watch` and is not part of CI.

Node is 22 in both workflows. The checked-in GitHub workflow previously requested Node 21. The locked tree installs `jsdom@27` with `parse5@8`, and `parse5@8` is ESM-only. Node 21.7 cannot `require()` that package, so Vitest fails while loading jsdom and then does not exit. Node 22 can load it. `npm ci` itself did not need a lockfile change.

## GitHub-only pieces

These stay out of Depot:

- **Artifact upload.** `actions/upload-artifact@v4` kept a `dist` artifact for 7 days. Depot still runs the production build, and a failed build fails `verify`. It does not upload `dist/`.
- **The GitHub-hosted runner.** `ubuntu-latest` is replaced by `depot-ubuntu-24.04`.
- **Vercel deploys triggered by GitHub.** `vercel.json` sets the build command to `npm run build`, the framework to Angular, and the output directory to `dist/erin's-escapades/browser`. There is no deploy workflow under `.github/workflows/`. Vercel ships from its GitHub connection. Detaching the repository from GitHub stops those deploys. Depot CI does not deploy. Reconnect the Vercel project to the replacement remote, or deploy with the Vercel CLI. Project environment variables stay in Vercel. The Angular build writes to `dist/` (`angular.json` sets the browser output to `.` under `./dist`). `vercel.json` still points at `dist/erin's-escapades/browser`, which this build does not create. That mismatch is already in the tree and is left as-is.

## Secrets to enter in Depot

The GitHub Actions workflow uses no secrets. Nothing from GitHub Actions needs to be copied.

| Name | Used by | If it is missing |
| --- | --- | --- |
| `XAI_API_KEY` | `ai-review`, sent as a bearer token to `https://api.x.ai/v1/chat/completions` (model `grok-4.5`) | The job prints `AI review skipped: XAI_API_KEY is not set` and exits 0 |

When the key is set, the script reviews the pull request diff and posts or updates one comment with:

```text
origin pr comment <PR_NUMBER> --body-file <file> --edit-last --create-if-none
```

`PR_NUMBER` comes from `github.event.pull_request.number`. The base ref comes from `github.base_ref`. If the Origin CLI is missing, or the comment command fails, the review text is printed to the log and the job exits 0. A failed xAI request still fails the job.

`GEMINI_API_KEY` is named in the README for a local `.env.local` file. The application code and both workflows do not read it. Do not add it to Depot for CI.
