# Finly

Financial calculators for Poland: compare employment and B2B income, or estimate mortgage repayments and apartment purchase costs. Available in Polish, English, and Russian, with shareable calculator settings.

- [Open Finly](https://qunapi.github.io/finly/)
- [GitHub Actions — deployment status and logs](https://github.com/Qunapi/finly/actions/workflows/deploy.yml)

## Development

Use Node.js 20, matching the deployment workflow.

```sh
npm ci
npm run dev
```

## Checks

```sh
npm test
npm run lint
npm run build
```

To build with the GitHub Pages `/finly` path:

```sh
GITHUB_REPOSITORY=Qunapi/finly npm run build
```

## Deployment

Every push to `main` automatically builds and deploys the static site to GitHub Pages. You can also select **Run workflow** on the [deployment workflow](https://github.com/Qunapi/finly/actions/workflows/deploy.yml).

The exported site is written to `out/`. The app checks for new releases automatically and reloads when an update is detected, preserving calculator inputs in the URL.

Calculations are estimates based on the assumptions shown in the app; actual payroll, bank offers, and purchase fees can differ.
