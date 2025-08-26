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

    const { NOTION_API_KEY, NOTION_DATABASE_ID } = process.env as Record<string, string | undefined>;

    if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
      return Response.json(
        {
          ok: false,
          error: "Notion export not configured. Set NOTION_API_KEY and NOTION_DATABASE_ID in your environment.",
        },
        { status: 501 }
      );
    }
    if (!Array.isArray(headlines) || headlines.length === 0) {
      return Response.json({ ok: false, error: 'No headlines provided' }, { status: 400 });
    }

    // Dynamic import so build doesn't fail if dependency missing
    let Client: any;
    try {
      const mod = await import('@notionhq/client');
      Client = mod.Client;
    } catch (e) {
      return Response.json({ ok: false, error: 'Notion SDK not installed. Run: npm i @notionhq/client' }, { status: 501 });
    }

    const notion = new Client({ auth: NOTION_API_KEY });

    // Retrieve database to find the title property name
    const db = await notion.databases.retrieve({ database_id: NOTION_DATABASE_ID });
    const props = db?.properties || {};
    const titlePropName = Object.keys(props).find((k) => props[k]?.type === 'title');
    if (!titlePropName) {
      return Response.json({ ok: false, error: 'No title property found in the Notion database' }, { status: 500 });
    }

    const pageTitle = (title && String(title).slice(0, 100)) || 'AI Headline Variations';

    // Build block children: intro + bulleted list of headlines
    const blocks: any[] = [];
    if (tone || audience) {
      const meta = [tone ? `Tone: ${tone}` : null, audience ? `Audience: ${audience}` : null].filter(Boolean).join(' · ');
      if (meta) {
        blocks.push({
          paragraph: { rich_text: [{ type: 'text', text: { content: meta } }] },
        });
      }
    }
    blocks.push({ heading_2: { rich_text: [{ type: 'text', text: { content: 'Generated Headlines' } }] } });
    for (const h of headlines) {
      blocks.push({ bulleted_list_item: { rich_text: [{ type: 'text', text: { content: String(h) } }] } });
    }

    const page = await notion.pages.create({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        [titlePropName]: {
          title: [
            {
              type: 'text',
              text: { content: pageTitle },
            },
          ],
        },
      },
      children: blocks,
    });

    return Response.json({ ok: true, pageId: page?.id, url: page?.url }, { status: 200 });
  } catch (e: any) {
    console.error('Notion export error', e);
    const msg = e?.message || 'Export failed';
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
