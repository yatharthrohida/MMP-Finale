# Community Issue Reporting

SafeRoute community reports are stored in PostgreSQL and are separate from the platform's content-moderation `Report` records.

## Setup

After pulling this branch, apply the new migration from the `server` directory:

```bash
npx prisma migrate deploy
npx prisma generate
```

For local development, `npx prisma migrate dev` can be used instead.

The existing authenticated upload endpoint is reused for optional report photos. Configure Cloudinary for durable production image hosting; without it, the server stores uploads in its local uploads directory.

## API

All responses use the standard `{ data: ... }` API envelope.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/community-issues` | Public | List the latest 200 community issues |
| POST | `/api/community-issues` | Signed-in user | Create an issue |
| POST | `/api/community-issues/:id/verify` | Signed-in user | Confirm an issue once per account |
| PATCH | `/api/community-issues/:id/status` | Admin | Update official status |

Issue creation accepts `category`, `description`, `locationName`, `longitude`, `latitude`, and optional `imageUrl`. Coordinates are rounded to three decimal places by the client before submission to reduce location precision.

Statuses are `UNVERIFIED`, `VERIFIED`, `IN_PROGRESS`, and `RESOLVED`. The client displays these as Reported, Under Review, In Progress, and Resolved.

Verification is recorded in a separate table with a unique issue/user constraint, preventing repeat confirmations by the same account.
