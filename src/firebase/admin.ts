// Server-only Firebase Admin helper. Dynamically imports firebase-admin so the app
// can compile/run even if the dependency isn't installed yet.

export type AdminContext = {
  getAuth: () => Promise<{ verifyIdToken: (token: string) => Promise<any> }>;
  getDb: () => Promise<{ doc: (path: string) => { get: () => Promise<{ exists: boolean; data: () => any }> } }>;
} | null;

export async function getAdmin(): Promise<AdminContext> {
  try {
    const appMod = await import('firebase-admin/app');
    const authMod = await import('firebase-admin/auth');
    const firestoreMod = await import('firebase-admin/firestore');

    const app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp();

    return {
      getAuth: async () => authMod.getAuth(app),
      getDb: async () => firestoreMod.getFirestore(app),
    } as unknown as AdminContext;
  } catch (e) {
    // firebase-admin not installed or failed to initialize
    return null;
  }
}

export async function verifyAndRequirePro(idToken: string): Promise<{ uid: string }> {
  const admin = await getAdmin();
  if (!admin) {
    throw new Error('ADMIN_NOT_CONFIGURED');
  }
  const auth = await admin.getAuth();
  const decoded = await auth.verifyIdToken(idToken);

  const db = await admin.getDb();
  const snap = await db.doc(`users/${decoded.uid}`).get();
  const data = snap.exists ? snap.data() : {};
  const status = (data?.status || 'free') as string;
  if (status !== 'pro') {
    throw new Error('FORBIDDEN_NOT_PRO');
  }
  return { uid: decoded.uid };
}
