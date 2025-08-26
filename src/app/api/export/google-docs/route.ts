import { verifyAndRequirePro } from '@/firebase/admin';
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authHeader.split(" ")[1];
    try {
      await verifyAndRequirePro(idToken);
    } catch (e: any) {
      if (e?.message === 'ADMIN_NOT_CONFIGURED') {
        return Response.json({ ok: false, error: 'Server auth not configured. Install and configure firebase-admin.' }, { status: 501 });
      }
      if (e?.message === 'FORBIDDEN_NOT_PRO') {
        return Response.json({ ok: false, error: 'Pro plan required for export.' }, { status: 403 });
      }
      return Response.json({ ok: false, error: 'Invalid or expired token.' }, { status: 401 });
    }

    const body = await req.json();
    const { title, headlines, tone, audience } = body || {};

    const {
      GOOGLE_DOCS_TOKEN,
      GOOGLE_DRIVE_FOLDER_ID,
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    } = process.env as Record<string, string | undefined>;

    if (!Array.isArray(headlines) || headlines.length === 0) {
      return Response.json({ ok: false, error: 'No headlines provided' }, { status: 400 });
    }

    // Dynamic import so build doesn't fail if dependency missing
    let google: any;
    try {
      const mod = await import('googleapis');
      google = mod.google;
    } catch (e) {
      return Response.json({ ok: false, error: 'googleapis not installed. Run: npm i googleapis' }, { status: 501 });
    }

    // Auth: prefer Service Account, fallback to provided OAuth access token
    let auth: any;
    if (GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      const privateKey = GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n');
      auth = new google.auth.JWT(
        GOOGLE_SERVICE_ACCOUNT_EMAIL,
        undefined,
        privateKey,
        [
          'https://www.googleapis.com/auth/documents',
          'https://www.googleapis.com/auth/drive',
        ]
      );
    } else if (GOOGLE_DOCS_TOKEN) {
      auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: GOOGLE_DOCS_TOKEN });
    } else {
      return Response.json(
        { ok: false, error: 'Google Docs export not configured. Provide service account creds or GOOGLE_DOCS_TOKEN.' },
        { status: 501 }
      );
    }

    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    const docTitle = (title && String(title).slice(0, 120)) || 'AI Headline Variations';
    const created = await docs.documents.create({ requestBody: { title: docTitle } });
    const documentId = created.data.documentId as string | undefined;
    if (!documentId) {
      return Response.json({ ok: false, error: 'Failed to create Google Doc' }, { status: 500 });
    }

    // Build document body content
    const lines: string[] = [];
    if (tone || audience) {
      const meta = [tone ? `Tone: ${tone}` : null, audience ? `Audience: ${audience}` : null]
        .filter(Boolean)
        .join(' · ');
      if (meta) lines.push(meta, '');
    }
    lines.push('Generated Headlines', '');
    for (const h of headlines as any[]) {
      lines.push(`- ${String(h)}`);
    }
    lines.push('');
    const contentText = lines.join('\n');

    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              text: contentText,
              endOfSegmentLocation: {},
            },
          },
        ],
      },
    });

    // Optionally add to a specific Drive folder
    if (GOOGLE_DRIVE_FOLDER_ID) {
      try {
        await drive.files.update({ fileId: documentId, addParents: GOOGLE_DRIVE_FOLDER_ID });
      } catch (e) {
        console.warn('Failed adding doc to Drive folder', e);
      }
    }

    const url = `https://docs.google.com/document/d/${documentId}`;
    return Response.json({ ok: true, documentId, url }, { status: 200 });
  } catch (e: any) {
    console.error('Google Docs export error', e);
    return Response.json({ ok: false, error: e?.message || 'Export failed' }, { status: 500 });
  }
}
