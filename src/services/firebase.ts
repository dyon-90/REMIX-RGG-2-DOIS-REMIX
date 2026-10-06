import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, memoryLocalCache, setLogLevel, Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Silencia logs internos e avisos transitórios de handshake de conexão do SDK do Firestore
setLogLevel('silent');

// Inicializar Firebase App (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const dbId = firebaseConfig.firestoreDatabaseId || undefined;

// Inicializa o Firestore com cache em memória e detecção inteligente de transporte
// Utiliza WebSockets por padrão (multiplexando todas as coleções em 1 conexão única)
// e fallback automático para long polling se WebSockets forem bloqueados pela rede/proxy
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      localCache: memoryLocalCache(),
      experimentalAutoDetectLongPolling: true,
    },
    dbId
  );
} catch (e) {
  firestoreDb = dbId ? getFirestore(app, dbId) : getFirestore(app);
}

// Inicializa o Firebase Authentication
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});

export const db = firestoreDb;
export { app };


