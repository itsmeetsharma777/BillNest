# Test and QA record

Run the automated checks with:

```bash
npm run test:smoke
```

| Test level | Coverage in this project |
| --- | --- |
| Unit / white-box | Phone normalization and global customer identity; money rounding, GST, invalid line rejection, and atomic invoice numbering. |
| Integration | Client API mapping, authenticated API routes, CSRF-token flow, MongoDB unique indexes, and scoped server queries are implemented as integration boundaries. Run them against an Atlas test database before release. |
| Smoke | TypeScript compilation, production Vite bundle, and all Vitest unit suites. |
| System / black-box | Manual browser checklist: register a shop, set light/dark/system theme, create an invoice, verify the dynamic shop name in the UI and PDF, log out, log in, and confirm data returns from Atlas. |
| Acceptance | Empty first-run state; no personal identity in public preview; custom shop name appears in the header and invoice; readable print layout; protected routes reject missing session/CSRF headers. |

No test suite can truthfully guarantee zero defects. The release gate is passing automated checks plus the system checklist above against your own Atlas test cluster and supported browsers.
