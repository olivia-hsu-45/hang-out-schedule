// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 這是你的專屬 Firebase 配置
const firebaseConfig = {
  projectId: "gen-lang-client-0847520644",
  appId: "1:364649226534:web:ffd1561cb48d8c5a2f21e7",
  apiKey: "AIzaSyDrnT-7gu22vWhlXVmF91QXR-HEpIOgSh0",
  authDomain: "gen-lang-client-0847520644.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-olivia-696c951a-78f3-4e6d-bf80-343eb58e2d03",
  storageBucket: "gen-lang-client-0847520644.firebasestorage.app",
  messagingSenderId: "364649226534"
};

const app = initializeApp(firebaseConfig);
// 初始化並導出 db，指定使用該專屬的 firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
