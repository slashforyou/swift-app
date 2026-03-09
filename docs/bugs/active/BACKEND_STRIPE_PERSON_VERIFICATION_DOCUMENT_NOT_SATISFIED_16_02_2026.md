# 🚨 Backend ticket — Stripe onboarding (company): `person_*.verification.document` not clearing

**Date:** 2026-02-16  
**Priority:** ✅ Fixed in backend v3.2.1 (validate deploy)  
**Scope:** Connect Custom in-app onboarding (company persons + document upload)

---

## Summary

The mobile app can successfully upload identity document images to the backend (`POST /v1/stripe/onboarding/document`), but Stripe requirements never clear.

After upload succeeds, `POST /v1/stripe/onboarding/verify` still returns:

- `requirements.currently_due` contains `person_<id>.verification.document`
- same field appears in `past_due` and `eventually_due`
- `onboarding_complete: false`

Root cause was backend-side:

1. (v3.1) document was attached at **account** level instead of **person**.
2. (v3.2) even after switching to person-level, the second upload (`back`) overwrote the first (`front`) instead of merging.

Backend reports this is fixed in **v3.2.1** by merging existing `person.verification.document` before updating.

---

## Backend updates (reported)

### v3.2 (2026-02-16)

- Accept only multipart file field name: `file` (Multer `.single('file')`)
- Require `side=front|back`
- Accept multiple aliases for `person_id`
- **Attach document at PERSON level** via `stripe.accounts.updatePerson(...)` when the requirement is `person_<id>.verification.document`
- Create Stripe `File` with `purpose=identity_document` **on the connected account context** (`stripeAccount: acct_...`)

If v3.2 is deployed correctly, `person_*.verification.document` must clear after successful front+back uploads.

### v3.2.1 (2026-02-16)

Backend reports a follow-up fix:

- On `side=back` upload, backend **merges** with existing document state so it becomes:
  - after front: `{ front: file_front }`
  - after back: `{ front: file_front, back: file_back }`

Without merging, `back` overwrites `front` and Stripe keeps `person_*.verification.document` required.

---

## Observed app logs (key)

### 1) Verify shows the remaining required field

```text
🧾 [ONBOARDING] Requirements snapshot: {
  "currently_due": [
    "person_1T0aUzIyBVP7FOdV96i5JfGa.verification.document"
  ],
  "past_due": [
    "person_1T0aUzIyBVP7FOdV96i5JfGa.verification.document"
  ],
  "eventually_due": [
    "person_1T0aUzIyBVP7FOdV96i5JfGa.verification.document"
  ]
}
```

### 2) Backend expects multipart `side`

When sending a single file field without `side`, backend returns:

```text
HTTP 400 VALIDATION_ERROR
message: "Invalid side parameter. Must be \"front\" or \"back\""
required: ["side"]
allowed_values: ["front", "back"]
```

### 3) Working shape to pass backend validation

The only reliable format that passes the backend is a **two-request** upload:

- request A: `side=front` + one file
- request B: `side=back` + one file

Both using the file field key: `file`.

The backend rejects other file field names with Multer:

```text
MulterError: Unexpected field
```

---

## Current app request contract (what the backend must support)

### Endpoint

`POST /v1/stripe/onboarding/document`

### Content type

`multipart/form-data`

### Required fields

- `file` (multipart file)
- `side`: `front | back`
- `document_type`: `id_card | passport | driving_license`

### Optional fields (sent by app for compatibility)

The app also sends several aliases for the Stripe person id (non-file fields):

- `person_id`
- `personId`
- `person`
- `stripe_person_id`
- `stripePersonId`
- `stripe_person`
- `stripePerson`

Example (front):

```text
file: <jpeg>
side=front
document_type=id_card
person_id=person_1T0aUzIyBVP7FOdV96i5JfGa
```

Example (back):

```text
file: <jpeg>
side=back
document_type=id_card
person_id=person_1T0aUzIyBVP7FOdV96i5JfGa
```

---

## Expected backend behavior

### A) Attach uploaded file(s) to the correct Stripe person

Because the Stripe requirement is explicitly:

- `person_<id>.verification.document`

the backend must update the Stripe **person** (not only the account) and attach the verification document.

At minimum, after successful uploads, the backend should perform the equivalent of:

- upload file to Stripe (create file)
- update person verification field using the `person_<id>` referenced by the requirement / request

Then `POST /v1/stripe/onboarding/verify` should eventually return:

- `person_<id>.verification.document` removed from `currently_due`

#### Stripe implementation notes (important)

- For Connect **persons**, Stripe expects document fields like:
  - `person.verification.document.front = <file_id>`
  - `person.verification.document.back = <file_id>` (when applicable)
  - (or `additional_document.*` depending on requirement)

- The uploaded `File` must be created with purpose `identity_document`.

- **Connect constraint:** the `File` must belong to the **connected account** (`acct_...`).
  If the backend creates the File on the platform account (missing `Stripe-Account: acct_...` context), Stripe will not accept it for the connected person.
  Typical symptom: backend returns success, but `person_*.verification.document` remains required forever.

### B) Return a stable response payload

On successful upload, respond with:

```json
{
  "success": true,
  "onboarding_progress": 90,
  "next_step": "verify",
  "person_id": "person_..."
}
```

(Fields may vary, but must be consistent and non-500 on validation errors.)

---

## Why this is blocking

The mobile app routes steps based on Stripe requirements.

If `person_*.verification.document` never clears, the user cannot complete onboarding in-app (even though upload endpoints return success).

---

## Suggested backend debugging checklist

1. Log Multer accepted field names and confirm only `file` is allowed.
2. Log the incoming `side` + `document_type` + `person_id`.
3. Ensure the Stripe API call updates the **person** verification document (not only account-level verification).
4. Ensure the Stripe `File` is created **on the connected account** (`stripeAccount: acct_...`).
5. Ensure **merge** behavior (v3.2.1): `back` upload must preserve existing `front`.
6. After attaching, call Stripe to fetch updated requirements to confirm the field is cleared.
7. Return `4xx` validation errors (never HTML 500) for incorrect multipart field names.

---

## Acceptance criteria

- Uploading **front then back** via the app clears:
  - `person_<id>.verification.document`
- `POST /v1/stripe/onboarding/verify` returns:
  - `requirements.currently_due` no longer contains the field
  - onboarding may still be `pending_verification` depending on Stripe review, but the document requirement is cleared.

---

## Notes

- Image quality may affect Stripe review outcomes, but the requirement staying **immediately** after upload strongly suggests the attachment step isn’t being applied correctly.
