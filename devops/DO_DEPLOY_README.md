Purpose

This README explains how to update or recreate a DigitalOcean App Platform app for the `frontend` directory of this repo using `doctl` from your local machine. You must run the `doctl` commands locally where you will paste your DigitalOcean API token (do NOT paste tokens here).

Pre-requisites

- `doctl` installed and configured locally (`doctl auth init`).
- You own the GitHub repo `ghulam-mujtaba5/MegiLance` and grant App Platform access when asked.
- The `devops/do-app-spec.yaml` file exists in this repo (created automatically by the assistant).

Common goals

1) Update existing App configured in App Platform to use the `frontend` directory build
2) Create a new App configured to automatically deploy on push

Commands (run locally)

1) Authenticate doctl (run locally):

```pwsh
# Run locally on your machine (not in chat)
doctl auth init
# Paste your DO API token when prompted
```

2) List existing apps and find your app id:

```pwsh
doctl apps list
```

3) If you already have an App and want to update it to use the spec (recommended):

```pwsh
# Replace <APP_ID> with result from doctl apps list
doctl apps update <APP_ID> --spec devops/do-app-spec.yaml
```

4) To create a new App from the spec instead:

```pwsh
doctl apps create --spec devops/do-app-spec.yaml
```

5) Tail build and deployment logs (helpful for diagnosing failures):

```pwsh
# list deployments
doctl apps deployments list <APP_ID>

# get logs for the last deployment
doctl apps logs get --app-id <APP_ID> --deployment-id <DEPLOYMENT_ID> --follow
```

6) Force a deployment from the current repo/branch (after pushing to GitHub):

```pwsh
doctl apps create-deployment <APP_ID>
```

Troubleshooting tips

- Build failures: open the logs with `doctl apps logs get` and look for the first error line in the builder output. Common fixes:
  - Ensure the `source_dir` is `frontend` (our spec uses that).
  - Ensure `build_command` is correct: `npm ci && npm run build` — the App Platform runs builds inside the repo; it will run `cd source_dir` first.
  - For Next.js, ensure `package.json` in `frontend` contains a `build` script (Next.js default `next build`) and a `start` script (`next start -p $PORT`).
  - If `next start` is used, be sure `NODE_ENV=production` and `PORT` env var is respected.
- Environment variables: set any `NEXT_PUBLIC_` envs or API URLs in App Platform under Settings → Components → Environment.
- If you previously used a custom Dockerfile, change `environment_slug` to `docker` and set `dockerfile_path` accordingly.

If you run the `doctl` commands and paste the failing deployment logs here, I'll analyze them and produce the exact repo/file changes or App settings to fix the problem.

Security note

- Do not paste your DigitalOcean API token or other secrets into this chat. Authenticate locally with `doctl auth init`, then run the commands above and share only the `doctl` output (IDs, logs). If you previously posted tokens, please revoke them in the DigitalOcean Control Panel.
