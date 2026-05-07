import { create } from 'zustand';
import { User } from 'firebase/auth';
import {
  pushAngles,
  pushTrajectory,
  registerSession,
  removeSession,
  subscribeAngles,
  subscribeTrajectory,
  claimMasterIfEmpty,
  subscribeMaster,
  setMasterOnDisconnect,
  cancelMasterOnDisconnect,
  releaseMaster,
  passControlTo,
  sendControlRequest,
  clearControlRequest,
  subscribeControlRequest,
  subscribeOtherSessions,
  SESSION_ID,
} from '../lib/firebase';

export type Angles = { j1: number; j2: number; j3: number };
export type Position = Angles;

type Log = { time: string; msg: string; type: 'ok' | 'warn' | 'err' | '' };
type RequestStatus = 'none' | 'pending' | 'denied';

interface ArmStore {
  // Auth
  user: User | null;
  setUser: (u: User | null) => void;

  // Ángulos
  angles: Angles;
  setAngle: (joint: keyof Angles, val: number) => void;
  setAngles: (a: Angles) => void;

  // Control master/espectador
  isMaster: boolean;
  spectator: boolean; // alias de !isMaster, mantenido para compatibilidad
  hasOtherSessions: boolean;
  otherSessionsCount: number;
  setSpectator: (v: boolean) => void;

  // Solicitud de control (espectador → maestro)
  controlRequest: { sessionId: string; ts: number } | null;
  controlRequestStatus: RequestStatus;
  passMasterControl: () => Promise<void>;
  requestMasterControl: () => Promise<void>;
  respondToControlRequest: (accept: boolean) => Promise<void>;

  // Trayectoria
  trajectory: Position[];
  addPosition: () => void;
  removeTrajectory: () => void;
  setTrajectory: (t: Position[]) => void;

  // Log
  logs: Log[];
  addLog: (msg: string, type?: Log['type']) => void;

  // Sincronización Firebase
  syncEnabled: boolean;
  _remoteUpdate: boolean;
  syncAngles: () => void;

  // Reproducción de trayectoria
  playIdx: number;
  playing: boolean;
  playTrajectory: () => void;
  stopPlay: () => void;

  // Estadísticas de sesión
  uptimeStart: number | null;
  sessionCount: number;
  alertCount: number;
  startUptime: () => void;
  getUptimeSeconds: () => number;

  // Suscripciones activas
  _unsubs: Array<() => void>;
  subscribeAll: (uid: string) => void;
  unsubscribeAll: () => void;
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export const useArmStore = create<ArmStore>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),

  angles: { j1: 45, j2: 30, j3: 60 },

  setAngle: (joint, val) => {
    set(s => ({ angles: { ...s.angles, [joint]: val } }));
    get().syncAngles();
  },

  setAngles: (a) => set({ angles: a }),

  isMaster: false,
  spectator: true,
  hasOtherSessions: false,
  otherSessionsCount: 0,
  setSpectator: (v) => set({ spectator: v, isMaster: !v }),

  controlRequest: null,
  controlRequestStatus: 'none',

  passMasterControl: async () => {
    const { user, controlRequest, addLog } = get();
    if (!user) return;
    await cancelMasterOnDisconnect(user.uid);
    if (controlRequest) {
      // Pasa directamente a quien solicitó (write atómico: master + limpiar request)
      await passControlTo(user.uid, controlRequest.sessionId);
      addLog('Control cedido a otra sesión', 'warn');
    } else {
      // Libera master — el siguiente espectador lo reclamará automáticamente
      await releaseMaster(user.uid);
      addLog('Control liberado', 'warn');
    }
  },

  requestMasterControl: async () => {
    const { user, addLog } = get();
    if (!user) return;
    await sendControlRequest(user.uid);
    set({ controlRequestStatus: 'pending' });
    addLog('Solicitud de control enviada', 'ok');
  },

  respondToControlRequest: async (accept: boolean) => {
    const { user, controlRequest, addLog } = get();
    if (!user || !controlRequest) return;
    if (accept) {
      await cancelMasterOnDisconnect(user.uid);
      // write atómico: nuevo master + limpiar request
      await passControlTo(user.uid, controlRequest.sessionId);
      addLog('Control cedido a otra sesión', 'warn');
    } else {
      await clearControlRequest(user.uid);
      addLog('Solicitud de control denegada', 'warn');
    }
  },

  trajectory: [],
  addPosition: () => {
    const { angles, trajectory, user } = get();
    const next = [...trajectory, { ...angles }];
    set({ trajectory: next });
    if (user) pushTrajectory(user.uid, next);
  },
  removeTrajectory: () => {
    const { user } = get();
    set({ trajectory: [] });
    if (user) pushTrajectory(user.uid, []);
  },
  setTrajectory: (t) => set({ trajectory: t }),

  logs: [],
  addLog: (msg, type = '') => {
    const time = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    set(s => ({ logs: [{ time, msg, type }, ...s.logs].slice(0, 30) }));
  },

  syncEnabled: true,
  _remoteUpdate: false,
  playIdx: 0,
  playing: false,

  syncAngles: () => {
    const { user, isMaster, _remoteUpdate, angles } = get();
    if (!user || !isMaster || _remoteUpdate) return;
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      pushAngles(user.uid, angles).catch(() => { });
    }, 80);
  },

  playTrajectory: () => {
    const { trajectory, playing, addLog } = get();
    if (playing) { get().stopPlay(); return; }
    if (trajectory.length === 0) {
      addLog('No hay posiciones en la trayectoria', 'warn');
      return;
    }

    addLog(`Reproduciendo trayectoria (${trajectory.length} poses)…`, 'ok');
    set({ playing: true, playIdx: 0 });

    const animateStep = (
      fromAngles: Angles, target: Angles,
      step: number, total: number, onDone: () => void,
    ) => {
      if (!get().playing) return;
      if (step > total) { onDone(); return; }
      const t = step / total;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      set({
        angles: {
          j1: fromAngles.j1 + (target.j1 - fromAngles.j1) * ease,
          j2: fromAngles.j2 + (target.j2 - fromAngles.j2) * ease,
          j3: fromAngles.j3 + (target.j3 - fromAngles.j3) * ease,
        },
      });
      get().syncAngles();
      setTimeout(() => animateStep(fromAngles, target, step + 1, total, onDone), 50);
    };

    const playNext = (idx: number) => {
      const { trajectory, playing } = get();
      if (!playing || idx >= trajectory.length) {
        set({ playing: false });
        addLog('Trayectoria completada', 'ok');
        return;
      }
      const from = { ...get().angles };
      const target = trajectory[idx];
      set({ playIdx: idx });
      animateStep(from, target, 0, 20, () => {
        addLog(`Posición #${idx + 1} alcanzada`, 'ok');
        setTimeout(() => playNext(idx + 1), 400);
      });
    };

    playNext(0);
  },

  stopPlay: () => {
    set({ playing: false });
    get().addLog('Reproducción detenida', 'warn');
  },

  uptimeStart: null,
  sessionCount: 1,
  alertCount: 0,

  startUptime: () => {
    if (get().uptimeStart) return;
    set({ uptimeStart: Date.now() });

    // Contador diario persistido en localStorage
    const today = new Date().toISOString().slice(0, 10);
    let count = 1;
    try {
      const raw = localStorage.getItem('robolink_session_count');
      const data = raw ? JSON.parse(raw) : null;
      count = data?.date === today ? data.count + 1 : 1;
    } catch {}
    try {
      localStorage.setItem('robolink_session_count', JSON.stringify({ date: today, count }));
    } catch {}
    set({ sessionCount: count });
  },

  getUptimeSeconds: () => {
    const start = get().uptimeStart;
    if (!start) return 0;
    return Math.floor((Date.now() - start) / 1000);
  },

  _unsubs: [],

  subscribeAll: (uid) => {
    const { addLog, setTrajectory } = get();

    const unsubAngles = subscribeAngles(uid, (a) => {
      set({ _remoteUpdate: true, angles: a });
      setTimeout(() => set({ _remoteUpdate: false }), 100);
    });

    // Suscripción al campo master — determina quién controla
    const unsubMaster = subscribeMaster(uid, async (masterSessionId) => {
      const wasMaster = get().isMaster;

      if (masterSessionId === SESSION_ID) {
        // Esta sesión es la maestra
        set({ isMaster: true, spectator: false, controlRequestStatus: 'none' });
        setMasterOnDisconnect(uid);
        if (!wasMaster) addLog('Control obtenido', 'ok');

      } else if (masterSessionId === null) {
        // No hay maestro — intentar reclamar con transacción atómica
        const claimed = await claimMasterIfEmpty(uid);
        if (claimed) {
          set({ isMaster: true, spectator: false, controlRequestStatus: 'none' });
          setMasterOnDisconnect(uid);
          addLog('Control asignado automáticamente', 'ok');
        } else {
          set({ isMaster: false, spectator: true });
          if (wasMaster) addLog('Control liberado', 'warn');
        }

      } else {
        // Otra sesión es la maestra
        set({ isMaster: false, spectator: true });
        if (wasMaster) addLog('Control transferido a otra sesión', 'warn');
      }
    });

    // Suscripción a solicitudes de control entrantes
    const unsubRequest = subscribeControlRequest(uid, (req) => {
      const prevReq = get().controlRequest;
      set({ controlRequest: req });

      if (req && get().isMaster) {
        addLog('Solicitud de control recibida', 'warn');
        set(s => ({ alertCount: s.alertCount + 1 }));
      }

      // Solicitud limpiada mientras éramos espectadores con petición pendiente → denegada
      if (!req && prevReq && get().controlRequestStatus === 'pending' && !get().isMaster) {
        set({ controlRequestStatus: 'denied' });
        addLog('Solicitud de control denegada', 'warn');
      }
    });

    const unsubTraj = subscribeTrajectory(uid, setTrajectory);

    const unsubSessions = subscribeOtherSessions(uid, (count) => {
      set({ hasOtherSessions: count > 0, otherSessionsCount: count });
    });

    set({ _unsubs: [unsubAngles, unsubMaster, unsubRequest, unsubTraj, unsubSessions] });
  },

  unsubscribeAll: () => {
    get()._unsubs.forEach(u => u());
    set({ _unsubs: [], trajectory: [], spectator: true, isMaster: false, hasOtherSessions: false, otherSessionsCount: 0, user: null, controlRequest: null, controlRequestStatus: 'none' });
  },
}));
