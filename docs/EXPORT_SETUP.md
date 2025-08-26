# Export Integrations Setup (Notion & Google Docs)

This app includes server API routes to export generated headlines to Notion and Google Docs.
Out of the box, they are safe stubs that return 501 until you add credentials.

## Notion

1. Create a Notion internal integration and copy the secret.
2. Share a target database with the integration and copy the database ID.
3. Add the following environment variables (e.g., `.env.local`):

```
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

4. Implement the Notion API call inside `src/app/api/export/notion/route.ts` using `@notionhq/client`:
   - Install: `npm i @notionhq/client`
   - Create a page/item in your database with the `title` and `headlines` array.

## Google Docs

There are two ways to authenticate; we recommend a Service Account for server-to-server writes.

Option A: Service Account (recommended)
- Create a Google Cloud project and enable Google Docs + Drive APIs.
- Create a Service Account and a JSON key.
- Share a target Drive folder with the service account email.
- Add env vars:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=optional_folder_id
```

- Implement `src/app/api/export/google-docs/route.ts` using `googleapis` to create a Doc and write the headlines.
  - Install: `npm i googleapis`

Option B: OAuth Access Token (simple, manual)
- Obtain a short-lived `GOOGLE_DOCS_TOKEN` access token for Docs/Drive.
- Add env var:

```
GOOGLE_DOCS_TOKEN=ya29....
GOOGLE_DRIVE_FOLDER_ID=optional_folder_id
```

- Note: This requires refreshing the token regularly; prefer the Service Account approach.

## Auth & Pro Gating

- Client attaches a Firebase ID token in `Authorization: Bearer <token>` for export requests.
- For production, add server-side validation in the API routes:
  1) Verify the token with Firebase Admin (`firebase-admin`).
  2) Read `users/{uid}` from Firestore and check `status === 'pro'`.
- Dependencies to add:

```
npm i firebase-admin
```

- Create a server-only admin initializer (e.g., `src/firebase/admin.ts`) that uses a service account or Application Default Credentials.

## Firestore Rules

Use `firebase/firestore.rules` in this repo as a baseline. Apply them via the Firebase Console or CLI:

```
firebase deploy --only firestore:rules
```

## Testing

- Without env vars, export endpoints respond with 501 and a helpful message.
- After configuring, test from the app by generating headlines and clicking Notion/Google Docs export.
- Monitor server logs for errors.
