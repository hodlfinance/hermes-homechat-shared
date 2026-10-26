# Agent instructions

Before planning, selecting skills, accessing Linear, or changing this
repository, read and follow the canonical shared instructions and repository
registry:

- [`hodlfinance/hodl-coordination/AGENTS.md`](https://github.com/hodlfinance/hodl-coordination/blob/master/AGENTS.md)
- [`hodlfinance/hodl-coordination/portfolio.yaml`](https://github.com/hodlfinance/hodl-coordination/blob/master/portfolio.yaml)

This repository is the `hermes-homechat-shared` component listed in that
registry. If either shared source cannot be read, stop rather than infer its
rules. This file adds no separate product authority.

## CI runners (HPD-1749, HPD-654)

CI runs on our own machine, not GitHub-hosted runners: `runs-on: [self-hosted, hodl-ci]` (repo-scoped runner `hodl-ci-shared` on `hodl-ci-runner-1`, interim in the Hetzner project hey-hermes, move tracked in HPD-1755). `scripts/lint-workflow-runners.mjs` runs in CI and fails on any hosted or other-product label. Table repo, label, machine, project: Linear HPD-654.
