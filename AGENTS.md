# TaskFlow contributor guidance

- Use `feature/` branches, as explicitly requested by Karol. `main` is the final submission branch.
- Keep local `.env`, `.tools`, generated reports, original ZIPs and `materialy/` outside Git.
- Preserve the shared HTTP contracts in `docs/API.md` when changing backend or frontend.
- Use the SDK in `global.json`; full verification is `node scripts/verify.mjs --e2e` and requires Docker.
- Keep authorization in server services. Admin does not bypass project membership. Preserve cookie/CSRF and JWT isolation.
- Record substantive AI assistance and actual verification in the documentation. Never invent review, tests, CI results or earlier history.
