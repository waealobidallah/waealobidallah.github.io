
## Deployment
Pushing to `main` runs `.github/workflows/deploy.yml`: it assembles `src/` → `_site`, and **if the repository secret `SITE_PASSWORD` exists** it encrypts every page with [StatiCrypt](https://github.com/robinmoisson/staticrypt) (AES-256, client-side) so the site is a private preview. To go public: Settings → Secrets → delete `SITE_PASSWORD`, and remove the `robots.txt` line in the workflow, then re-run the workflow.
