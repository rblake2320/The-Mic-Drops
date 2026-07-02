# League of Its Own — Differentiation Blueprint

The MIC Drops' core points are fixed: consumer-controlled, algorithm-free,
deterministic delivery of atomic, source-anchored Drops from consent-gated
creators. Everything below deepens those points; nothing replaces them.

## The thesis

Anyone can copy "short content + push notifications." What no platform on
earth ships is **the anti-algorithm claim as a mechanically verifiable
property**. Feeds ask users to trust them. The MIC Drops can *prove* three
things no competitor proves:

1. **What was said has not been silently changed** (provenance chain — SHIPPED)
2. **Where it came from is committed, not just linked** (anchor hashes — SHIPPED)
3. **Why you received it is deterministic and auditable** (delivery receipts — NEXT)

Trust-as-infrastructure is the moat. It is also unfakeable by incumbents:
TikTok/YouTube/X *cannot* publish delivery receipts, because their delivery
logic is the secret they sell ads against. The MIC Drops can, because
deterministic delivery is the product.

## Ladder (in build order)

### Rung 0 — SHIPPED in this patch set
- `ProvenanceEntry` append-only hash chain; entries committed on both publish
  paths (API + scheduled worker)
- Public verification: `GET /api/provenance/verify` (whole chain + live-row
  cross-check) and `GET /api/provenance/drops/:id` (per-drop receipt)
- Pure chain logic in `server/provenance/chain.ts` — stdlib crypto,
  length-prefixed canonicalization, fully unit-tested (tamper / delete /
  reorder detection)

### Rung 1 — Verified Source badge (frontend, ~1 day)
Feed cards for drops with a ledger entry show a "Source-verified" mark that
opens the receipt: content hash, anchor (source + timecode), commit time,
`contentIntact: true`. The moment a user can *tap the proof*, the claim stops
being copy.

### Rung 2 — Delivery receipts ("why you got this")
Attach to every push a signed receipt: `declaredInterest ∩ drop.category`,
active subscription id, ledger seq, timestamp. Endpoint:
`GET /api/receipts/:pushId`. This makes "no algorithm" auditable per
notification — the single most differentiated feature in the product.

### Rung 3 — Consent-bound synthesis
`Creator.consentRecord` already exists. Hash-commit it into the chain when a
creator is AUTHORIZED; every TTS render then carries a consent token
referencing that hash. No consent hash → no synthesis, mechanically. This
kills the deepfake objection structurally and is C2PA-compatible later
(emit content credentials on generated audio).

### Rung 4 — External chain anchoring
Periodically publish the ledger head hash somewhere the platform cannot
rewrite (public git repo, OpenTimestamps, even a scheduled tweet). Converts
"trust our database" into "verify against a third party."

### Rung 5 — Creator sovereignty export
One-click export of a creator's full channel: drops, subscriber counts,
consent record, and the ledger proof segment. "Own your list / never rented
land" made literal — and a powerful creator-acquisition pitch against every
platform that traps archives.

### Rung 6 — AI layer, provenance-grounded
Execute `docs/AI_UPSELL_STRATEGY.md` with one upgrade over every RAG product:
Ask-the-Vault answers cite **ledger entries**, not just documents. Each cited
claim links to a hash-verified drop + source timecode. Grounded AI where the
grounding itself is tamper-evident.

## Guardrails (unchanged core points)
- Deterministic delivery only — no engagement-optimization creep, ever
- SENT-only public surface; DRAFT is private by construction
- AUTHORIZED consent lifecycle is the only public creator path; persona/demo
  content stays behind the investor wall, clearly labeled
- Ledger is append-only — no UPDATE/DELETE on `ProvenanceEntry`, in code
  review and in any future migration
