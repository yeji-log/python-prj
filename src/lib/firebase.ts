import { getApp, getApps, initializeApp, FirebaseOptions } from "firebase/app";
import { Auth, GoogleAuthProvider, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

// Firebase 콘솔에서 발급한 이 프로젝트(python-prj-2494e)의 웹 앱 설정값.
// apiKey 등은 비밀키가 아니라 클라이언트에 그대로 노출되는 공개 설정값이라
// 코드에 기본값으로 넣어도 안전하다. 배포 환경변수(NEXT_PUBLIC_FIREBASE_*)를
// 따로 등록하면 그 값이 우선 적용되어, 나중에 다른 Firebase 프로젝트로
// 바꾸고 싶을 때(예: 운영/개발 분리)도 코드 수정 없이 대응할 수 있다.
const DEFAULT_FIREBASE_CONFIG: FirebaseOptions = {
  apiKey: "AIzaSyAANkoAoeRAiGZH5YoniwybejAqOHE_aic",
  authDomain: "python-prj-2494e.firebaseapp.com",
  projectId: "python-prj-2494e",
  storageBucket: "python-prj-2494e.firebasestorage.app",
  messagingSenderId: "249117652253",
  appId: "1:249117652253:web:127080e347ebe644135df4",
};

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

const isBrowser = typeof window !== "undefined";

// 개발 중 .env.local 설정을 깜빡했을 때 원인을 바로 알 수 있도록 경고만 남기고,
// 앱 자체는 (로그인 화면은 못 쓰더라도) 깨지지 않게 한다.
if (!firebaseConfigured && isBrowser) {
  // eslint-disable-next-line no-console
  console.warn(
    "Firebase 설정값이 없어요. .env.local(.env.local.example 참고) 또는 배포 환경변수를 채워주세요."
  );
}

// Next.js는 "use client" 페이지도 빌드 시 서버에서 한 번 미리 렌더링한다.
// 그때 이 모듈도 서버에서 평가되는데, 거기서 getAuth()/getFirestore()를
// 그대로 부르면 (특히 환경변수가 비어있을 때) auth/invalid-api-key 같은
// 예외가 즉시 발생해 next build 전체가 실패한다. 이 앱은 Firebase를
// 오직 브라우저(useEffect·이벤트 핸들러) 안에서만 쓰므로, 서버 평가
// 시점에는 초기화 자체를 건너뛰어도 안전하다.
export const app =
  isBrowser && firebaseConfigured
    ? getApps().length
      ? getApp()
      : initializeApp(firebaseConfig)
    : undefined;

export const auth = (app ? getAuth(app) : undefined) as Auth;
export const db = (app ? getFirestore(app) : undefined) as Firestore;
export const googleProvider = new GoogleAuthProvider();
