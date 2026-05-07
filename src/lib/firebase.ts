import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  onValue,
  remove,
  update,
  onDisconnect,
  runTransaction,
} from 'firebase/database';

const firebaseConfig = {
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});

export const db = getDatabase(app);

export const SESSION_ID = Math.random().toString(36).slice(2);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const onAuthChange = (cb: (user: User | null) => void) =>
  onAuthStateChanged(auth, cb);

// ─── PRESENCIA ────────────────────────────────────────────────────────────────
export async function registerSession(uid: string) {
  const sessRef = ref(db, `users/${uid}/sessions/${SESSION_ID}`);
  await set(sessRef, { active: true, ts: Date.now() });
  onDisconnect(sessRef).remove();
}

export function removeSession(uid: string) {
  return remove(ref(db, `users/${uid}/sessions/${SESSION_ID}`));
}

// ─── MAESTRO ──────────────────────────────────────────────────────────────────
// Intenta reclamar master solo si el campo está vacío (transacción atómica).
// Retorna true si esta sesión quedó como master.
export async function claimMasterIfEmpty(uid: string): Promise<boolean> {
  const masterRef = ref(db, `users/${uid}/master`);
  let claimed = false;
  await runTransaction(masterRef, (current) => {
    if (current === null || current === undefined) {
      claimed = true;
      return SESSION_ID;
    }
    return current; // no modificar — aborta el cambio
  });
  return claimed;
}

export function subscribeMaster(uid: string, cb: (masterSessionId: string | null) => void) {
  return onValue(ref(db, `users/${uid}/master`), snap => cb(snap.val() ?? null));
}

// Configura que al desconectarse, se elimine el campo master (solo llamar si somos master).
export function setMasterOnDisconnect(uid: string) {
  onDisconnect(ref(db, `users/${uid}/master`)).remove();
}

export async function cancelMasterOnDisconnect(uid: string) {
  await onDisconnect(ref(db, `users/${uid}/master`)).cancel();
}

export function releaseMaster(uid: string) {
  return remove(ref(db, `users/${uid}/master`));
}

// Pasa control a otra sesión y limpia la solicitud en un solo write atómico.
export async function passControlTo(uid: string, targetSessionId: string) {
  const updates: Record<string, any> = {
    [`users/${uid}/master`]: targetSessionId,
    [`users/${uid}/controlRequest`]: null,
  };
  return update(ref(db), updates);
}

// ─── SOLICITUD DE CONTROL ─────────────────────────────────────────────────────
export function sendControlRequest(uid: string) {
  return set(ref(db, `users/${uid}/controlRequest`), {
    sessionId: SESSION_ID,
    ts: Date.now(),
  });
}

export function clearControlRequest(uid: string) {
  return remove(ref(db, `users/${uid}/controlRequest`));
}

export function subscribeControlRequest(
  uid: string,
  cb: (req: { sessionId: string; ts: number } | null) => void
) {
  return onValue(ref(db, `users/${uid}/controlRequest`), snap => cb(snap.val() ?? null));
}

// ─── SESIONES ACTIVAS ────────────────────────────────────────────────────────
export function subscribeOtherSessions(uid: string, cb: (count: number) => void) {
  return onValue(ref(db, `users/${uid}/sessions`), snap => {
    const sessions = snap.val() || {};
    const others = Object.keys(sessions).filter(sid => sid !== SESSION_ID);
    cb(others.length);
  });
}

// ─── ÁNGULOS ─────────────────────────────────────────────────────────────────
export function pushAngles(uid: string, angles: { j1: number; j2: number; j3: number }) {
  return set(ref(db, `users/${uid}/angles`), angles);
}

export function subscribeAngles(uid: string, cb: (a: { j1: number; j2: number; j3: number }) => void) {
  return onValue(ref(db, `users/${uid}/angles`), snap => {
    if (snap.val()) cb(snap.val());
  });
}

// ─── TRAYECTORIA ─────────────────────────────────────────────────────────────
export function pushTrajectory(uid: string, trajectory: any[]) {
  return set(ref(db, `users/${uid}/trajectory`), trajectory.length > 0 ? trajectory : null);
}

export function subscribeTrajectory(uid: string, cb: (t: any[]) => void) {
  return onValue(ref(db, `users/${uid}/trajectory`), snap => {
    const data = snap.val();
    cb(Array.isArray(data) ? data : data ? Object.values(data) : []);
  });
}
