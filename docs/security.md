> Historical V1 planning document. Current implementation, disabled cloud/integrations, and unrun physical acceptance are documented in [CODEX_HANDOFF.md](CODEX_HANDOFF.md). Do not interpret historical launch or verification claims as V2 evidence.

# Security & Data Governance Policy

## 1. Multi-Tenant Dealership Isolation

In an automotive SaaS platform, cross-tenant data leakage is catastrophic. One dealership must NEVER be able to view another dealership's inventory, staff activity, or media assets.

### Guardrails:
1. **PostgreSQL Row Level Security (RLS)**: Every query executed against the remote database enforces dealership membership access via `current_user_has_dealership_access(dealership_id)`.
2. **Private Storage Buckets**: Captured photographs are stored in private S3/Supabase storage buckets accessible only via signed URLs with short expiration windows (e.g. 15 minutes).
3. **No Service-Role Keys**: The Supabase `service_role` key is strictly forbidden from client source code, Vite environment files, and frontend bundles. Only the public `anon` key is exposed.

## 2. Public Repository Guardrails

The `DIABDOESDATA/smart-capture` repository is PUBLIC. The following artifacts must NEVER be committed to Git:
- Supabase service-role keys or database connection strings
- Personal access tokens (PATs) or OAuth client secrets
- Dealership financial records, real buyer PII, or internal sales records
- Production credentials stored in development files or logs

### Verification:
Continuous security scanning is automated via GitHub Actions:
- **CodeQL**: Static code analysis scanning for injection vulnerabilities, path traversals, and insecure data flows.
- **NPM Audit**: High/critical vulnerability thresholds monitored on every pull request.
- **Git History Inspection**: Prior to publishing releases, Git history is scanned to ensure zero accidental credential leakage.

## 3. Metadata & Privacy Protection

When exporting photographs for public vehicle listings, Smart Capture strips unnecessary sensitive location metadata (EXIF GPS coordinates) from exported files by default to protect employee lot privacy and prevent exposing unlisted physical vehicle storage locations.
