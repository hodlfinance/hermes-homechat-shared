# Hermes Homechat Shared

Shared, product-neutral Homechat helpers and composer chrome used by Hey Hermes and FinanceHermes.

This package intentionally contains no application secrets, no Finance data access, and no runtime credentials. Product apps keep their own API clients, styling, source cards, finance chips, and permission flows.

## Boundary

Shared here:

- Homechat status/action/composer state helpers
- Voice notice and recording MIME helpers
- Generic composer chrome and voice meter React components

Not shared here:

- Hey Hermes account/runtime ownership
- FinanceHermes HODL/CapChat tools
- product-specific CSS, copy, source cards, action proposals, or backend clients
