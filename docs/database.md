# Local persistence and cloud security status V2

Local database `smart-capture-db` version 2 preserves all version-1 object stores and adds `media` and `settings`. Sessions contain metadata and durable image IDs; images/originals/derivatives and 320px thumbnails live separately. Native Blob storage has an atomic ArrayBuffer fallback where WebKit cannot persist backing files. Lazy data-URL migration commits media and session together, leaving originals intact on failure. Retakes preserve prior media IDs and retries replace the same shot code. Session deletion removes current and historical media.

**Cloud is disabled for the standalone pilot, even when environment credentials are supplied. Do not run the original Supabase migration in production as a deployment-ready schema.** No remote database or storage bucket was accessed or modified.

Review of the checked-in SQL confirms active members receive broad FOR ALL rights, including membership/role mutation. A photographer can change privileged membership attributes within an accessible dealership. The public security-definer access helper also lacks a fixed search_path. Original documentation's strict-isolation guarantee was unverified. No authenticated membership lifecycle, private storage policies, cross-tenant FK authorization or adversarial tenant test suite has been demonstrated.

Before cloud enablement: separate read/write/member-administration policies by actual role; restrict membership provisioning; fix and scope helper permissions/search_path; validate cross-table tenant association; create private object policies; test anon, photographer, manager, revoked member and two independent dealerships. Test insert/update/delete and identifier-reassignment attempts. No service-role/secret key belongs in browser code. Confirm server responses before marking uploads synchronized; implement idempotency and resumable queues behind an explicit new approval milestone.

Supabase skill/docs consulted: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [changelog](https://supabase.com/changelog). No backend test results are claimed because no isolated configured backend was provided.
