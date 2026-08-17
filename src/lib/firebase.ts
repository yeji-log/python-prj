import { getApp, getApps, initializeApp, FirebaseOptions } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

// 개발 중 .env.local 설정을 깜빡했을 때 원인을 바로 알 수 있도록 경고만 남기고,
// 앱 자체는 (로그인 화면은 못 쓰더라도) 깨지지 않게 한다.
if (!firebaseConfigured && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.warn(
    "Firebase 설정값이 없어요. .env.local(.env.local.example 참고)을 채워주세요."
  );
}

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
