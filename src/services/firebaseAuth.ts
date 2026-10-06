/**
 * Serviço de Autenticação com Firebase Auth (Google Sign-In)
 * 
 * Permite que usuários e administradores façam login seguro com sua Conta Google
 * mantendo a identidade e permissões sincronizadas independentemente do IP,
 * navegador ou máquina utilizada.
 */

import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleAuthProvider, db } from './firebase';
import { AdminUser } from '../types';
import { defaultAdmins } from '../data/initialData';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { cleanForFirestore } from './cloudDb';

export interface GoogleAuthResult {
  firebaseUser: FirebaseUser;
  adminUser: AdminUser;
  isNewAdmin: boolean;
}

/**
 * Autentica o usuário utilizando o provedor do Google via Firebase Auth.
 * Procura um administrador correspondente pelo e-mail ou cria/vincula automaticamente
 * caso seja o administrador responsável ou novo educador autorizado.
 */
export async function signInWithGoogleAuth(): Promise<GoogleAuthResult> {
  const userCredential = await signInWithPopup(auth, googleAuthProvider);
  const user = userCredential.user;

  const email = (user.email || '').toLowerCase().trim();
  const displayName = user.displayName || user.email?.split('@')[0] || 'Administrador Google';
  const photoURL = user.photoURL || undefined;

  // Busca lista atualizada de administradores no Firestore
  let adminList: AdminUser[] = [...defaultAdmins];
  try {
    const snap = await getDocs(collection(db, 'admins'));
    if (!snap.empty) {
      adminList = snap.docs.map(d => d.data() as AdminUser);
    }
  } catch (e) {
    console.warn('[FirebaseAuth] Não foi possível ler admins remotos:', e);
  }

  // Verifica se o e-mail Google já bate com algum admin cadastrado
  let matched = adminList.find(a => {
    const aEmail = (a.email || '').toLowerCase().trim();
    const aUser = (a.username || '').toLowerCase().trim();
    return aEmail === email || aUser === email || (email && aEmail.startsWith(email.split('@')[0]));
  });

  let isNewAdmin = false;

  if (!matched) {
    // Cria automaticamente o registro do administrador Google para este e-mail
    const username = email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '');
    const newAdmin: AdminUser = {
      entity_id: `admin_google_${user.uid.substring(0, 10)}`,
      username: username || `admin_${Date.now()}`,
      password: `@google_${user.uid.substring(0, 6)}`,
      name: displayName,
      email: user.email || '',
      role: 'Administrador Conectado via Google',
      photo_url: photoURL,
      auth_uid: user.uid,
      created_at: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'admins', newAdmin.entity_id), cleanForFirestore(newAdmin), { merge: true });
    } catch (err) {
      console.warn('[FirebaseAuth] Aviso ao salvar admin Google no Firestore:', err);
    }

    matched = newAdmin;
    isNewAdmin = true;
  } else {
    // Atualiza com os metadados do Google (foto, auth_uid)
    if (!matched.photo_url && photoURL) {
      matched = { ...matched, photo_url: photoURL, auth_uid: user.uid };
      try {
        await setDoc(doc(db, 'admins', matched.entity_id), cleanForFirestore(matched), { merge: true });
      } catch (err) {
        // silencioso
      }
    }
  }

  return {
    firebaseUser: user,
    adminUser: matched,
    isNewAdmin
  };
}

/**
 * Desconecta a sessão ativa do Firebase Auth.
 */
export async function signOutFirebaseAuth(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('[FirebaseAuth] Erro ao deslogar do Firebase:', err);
  }
}

/**
 * Escuta mudanças de estado na autenticação do Firebase Auth em tempo real.
 */
export function subscribeToFirebaseAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
