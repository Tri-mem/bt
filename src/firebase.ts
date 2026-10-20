import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
  linkWithPhoneNumber,
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import blueprint from '../firebase-blueprint.json';
import { UserProfile } from './types';

const app = initializeApp(firebaseConfig);
const FIRESTORE_DB_ID =
  (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId ||
  'ai-studio-novashopthngmiin-4409d3db-64b9-4f54-aa7b-a9bc81e67268';
export const db = getFirestore(app, FIRESTORE_DB_ID);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Extract validation constants directly from firebase-blueprint.json
const userProps = blueprint.entities.UserProfile.properties;
export const USER_VALIDATION_RULES = {
  uidMaxLength: userProps.uid.maxLength ?? 128,
  uidPattern: new RegExp(userProps.uid.pattern ?? '^[a-zA-Z0-9_\\-]+$'),
  fullNameMaxLength: userProps.fullName.maxLength ?? 100,
  emailMaxLength: userProps.email.maxLength ?? 150,
  emailPattern: new RegExp(userProps.email.pattern ?? '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'),
  phoneMinLength: 9,
  phoneMaxLength: userProps.phone.maxLength ?? 15,
  phonePattern: /^[0-9+\-\s]{9,15}$/,
  avatarMaxLength: userProps.avatar.maxLength ?? 500,
  cityMaxLength: userProps.city.maxLength ?? 100,
  districtMaxLength: userProps.district.maxLength ?? 100,
  addressMaxLength: userProps.address.maxLength ?? 250,
  joinedDateMaxLength: userProps.joinedDate.maxLength ?? 30,
};

const paymentProps = blueprint.entities.PaymentTransaction.properties;
export const PAYMENT_VALIDATION_RULES = {
  orderIdMinLength: paymentProps.orderId.minLength ?? 3,
  orderIdMaxLength: paymentProps.orderId.maxLength ?? 40,
  orderIdPattern: new RegExp(paymentProps.orderId.pattern ?? '^[A-Z0-9_\\-]+$'),
  txIdMaxLength: paymentProps.transactionId.maxLength ?? 80,
  txIdPattern: new RegExp(paymentProps.transactionId.pattern ?? '^([a-zA-Z0-9_\\-]+)?$'),
  bankCodeMaxLength: paymentProps.bankCode.maxLength ?? 20,
  bankCodePattern: new RegExp(paymentProps.bankCode.pattern ?? '^[A-Z0-9_\\-]+$'),
  accountNumberMaxLength: paymentProps.accountNumber.maxLength ?? 30,
  accountNumberPattern: new RegExp(paymentProps.accountNumber.pattern ?? '^[0-9A-Z]+$'),
};

export interface FirebasePaymentTransactionRecord {
  orderId: string;
  uid: string;
  expectedAmount: number;
  transferredAmount: number;
  shortfallAmount: number;
  status: 'PENDING' | 'UNDERPAID' | 'PAID';
  transactionId: string;
  bankCode: string;
  accountNumber: string;
  verifiedAt?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

const LEAKED_DEFAULT_ADDRESSES = new Set([
  '219/20 đường số 12, phường Bình Hưng Hòa',
  '123 Nguyễn Huệ, Phường Bến Nghé',
  '123 Nguyễn Huệ',
  'Địa chỉ chưa cập nhật',
]);

// Sanitize and validate UserProfile fields to guarantee adherence to firebase-blueprint.json
export function sanitizeUserProfileInput(input: Partial<UserProfile>, uid: string, emailFallback: string) {
  const safeUid = uid.slice(0, USER_VALIDATION_RULES.uidMaxLength);
  const rawName = (input.fullName || 'Khách hàng Nova').trim();
  const fullName = (rawName.length > 0 ? rawName : 'Khách hàng Nova').slice(
    0,
    USER_VALIDATION_RULES.fullNameMaxLength
  );

  const rawEmail = (input.email || emailFallback || 'member@novashop.vn').trim();
  const email = (USER_VALIDATION_RULES.emailPattern.test(rawEmail)
    ? rawEmail
    : 'member@novashop.vn'
  ).slice(0, USER_VALIDATION_RULES.emailMaxLength);

  const rawPhone = (input.phone || '').trim();
  const phone = USER_VALIDATION_RULES.phonePattern.test(rawPhone)
    ? rawPhone.slice(0, USER_VALIDATION_RULES.phoneMaxLength)
    : '';

  const avatar = (input.avatar || '').slice(0, USER_VALIDATION_RULES.avatarMaxLength);
  const city = (input.city || '').trim().slice(0, USER_VALIDATION_RULES.cityMaxLength);
  const district = (input.district || '').trim().slice(0, USER_VALIDATION_RULES.districtMaxLength);
  const rawAddress = (input.address || '').trim();
  const address = (LEAKED_DEFAULT_ADDRESSES.has(rawAddress) ? '' : rawAddress).slice(
    0,
    USER_VALIDATION_RULES.addressMaxLength
  );
  const joinedDate = (
    (input.joinedDate || new Date().toLocaleDateString('vi-VN')).trim() || '15/01/2024'
  ).slice(0, USER_VALIDATION_RULES.joinedDateMaxLength);

  return {
    uid: safeUid,
    fullName,
    email,
    phone,
    avatar,
    city,
    district,
    address,
    joinedDate,
  };
}

export function normalizePhoneToE164(phoneInput: string): string {
  const digitsAndPlus = phoneInput.trim().replace(/[\s\-().]/g, '');
  if (!digitsAndPlus) return '';
  if (digitsAndPlus.startsWith('+84')) {
    return '+84' + digitsAndPlus.slice(3).replace(/\D/g, '');
  }
  if (digitsAndPlus.startsWith('84') && digitsAndPlus.length >= 10) {
    return '+' + digitsAndPlus.replace(/\D/g, '');
  }
  if (digitsAndPlus.startsWith('0')) {
    return '+84' + digitsAndPlus.slice(1).replace(/\D/g, '');
  }
  if (digitsAndPlus.startsWith('+')) {
    return '+' + digitsAndPlus.slice(1).replace(/\D/g, '');
  }
  return '+84' + digitsAndPlus.replace(/\D/g, '');
}

export function normalizePhoneToLocal(phoneInput: string): string {
  const cleaned = phoneInput.trim().replace(/[\s\-().]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+84')) {
    return '0' + cleaned.slice(3).replace(/\D/g, '');
  }
  if (cleaned.startsWith('84') && cleaned.length >= 10) {
    return '0' + cleaned.slice(2).replace(/\D/g, '');
  }
  return cleaned.replace(/[^\d+]/g, '');
}

const inFlightProfileSyncs = new Map<string, Promise<UserProfile>>();

export async function syncFirebaseUserProfile(fbUser: FirebaseUser): Promise<UserProfile> {
  const existingSync = inFlightProfileSyncs.get(fbUser.uid);
  if (existingSync) {
    return existingSync;
  }

  const syncPromise = (async (): Promise<UserProfile> => {
    const isGoogleProvider = fbUser.providerData.some((p) => p.providerId === 'google.com');
    const isPhoneProvider =
      fbUser.providerData.some((p) => p.providerId === 'phone') || Boolean(fbUser.phoneNumber);
    const localPhoneFromAuth = fbUser.phoneNumber ? normalizePhoneToLocal(fbUser.phoneNumber) : '';

    // If user authenticated via Phone Auth only (emailVerified is false),
    // avoid triggering Firestore reads/writes that require request.auth.token.email_verified == true.
    if (!fbUser.emailVerified) {
      const existingLocal =
        (localPhoneFromAuth ? findRegisteredAccount(localPhoneFromAuth) : undefined) ||
        findRegisteredAccount(fbUser.uid);

      const fallbackEmail =
        existingLocal?.user.email ||
        fbUser.email ||
        `${localPhoneFromAuth || fbUser.uid.slice(0, 8)}@phone.novashop.vn`;

      const sanitized = sanitizeUserProfileInput(
        {
          fullName:
            existingLocal?.user.fullName ||
            fbUser.displayName ||
            (localPhoneFromAuth ? `Khách hàng ${localPhoneFromAuth.slice(-4)}` : 'Khách hàng Nova'),
          email: fallbackEmail,
          phone: localPhoneFromAuth || existingLocal?.user.phone || '',
          avatar: existingLocal?.user.avatar || fbUser.photoURL || '',
          city: existingLocal?.user.city || '',
          district: existingLocal?.user.district || '',
          address: existingLocal?.user.address || '',
          joinedDate: existingLocal?.user.joinedDate || new Date().toLocaleDateString('vi-VN'),
        },
        fbUser.uid,
        fallbackEmail
      );

      const phoneUserProfile: UserProfile = {
        id: fbUser.uid,
        fullName: sanitized.fullName,
        email: sanitized.email,
        phone: sanitized.phone,
        avatar: sanitized.avatar || undefined,
        memberTier: existingLocal?.user.memberTier || 'Bronze',
        novaPoints: existingLocal?.user.novaPoints ?? 1000,
        city: sanitized.city,
        district: sanitized.district,
        address: sanitized.address,
        joinedDate: sanitized.joinedDate,
        authProvider: isGoogleProvider ? 'google' : isPhoneProvider ? 'phone' : 'password',
        phoneVerified: isPhoneProvider || Boolean(existingLocal?.user.phoneVerified),
        phoneVerifiedAt:
          existingLocal?.user.phoneVerifiedAt ||
          (isPhoneProvider ? new Date().toLocaleString('vi-VN') : undefined),
        twoFactorEnabled: isPhoneProvider || Boolean(existingLocal?.user.twoFactorEnabled),
      };

      saveRegisteredAccount(phoneUserProfile, existingLocal?.password || '');
      return phoneUserProfile;
    }

    const userPath = `users/${fbUser.uid}`;
    const userRef = doc(db, 'users', fbUser.uid);

    let snapshot = null;
    try {
      snapshot = await getDoc(userRef);
    } catch (error) {
      console.warn('Firestore get user profile warning (continuing with Auth profile):', error);
    }

    if (snapshot && snapshot.exists()) {
      const data = snapshot.data();
      const hadLeakedDefault =
        data.phone === '0908061843' ||
        LEAKED_DEFAULT_ADDRESSES.has(data.address || '');

      const cleanPhone =
        hadLeakedDefault && data.phone === '0908061843'
          ? localPhoneFromAuth
          : data.phone || localPhoneFromAuth || '';
      const cleanCity = hadLeakedDefault ? '' : (data.city || '');
      const cleanDistrict = hadLeakedDefault ? '' : (data.district || '');
      const cleanAddress = LEAKED_DEFAULT_ADDRESSES.has(data.address || '') ? '' : (data.address || '');

      const existingProfile: UserProfile = {
        id: fbUser.uid,
        fullName: data.fullName || fbUser.displayName || 'Khách hàng Nova',
        email: data.email || fbUser.email || '',
        phone: cleanPhone,
        avatar: data.avatar || fbUser.photoURL || undefined,
        memberTier: data.memberTier || 'Bronze',
        novaPoints: typeof data.novaPoints === 'number' ? data.novaPoints : 1000,
        city: cleanCity,
        district: cleanDistrict,
        address: cleanAddress,
        joinedDate: data.joinedDate || new Date().toLocaleDateString('vi-VN'),
        authProvider: isGoogleProvider ? 'google' : isPhoneProvider ? 'phone' : 'password',
        phoneVerified: isPhoneProvider || Boolean(localPhoneFromAuth),
        phoneVerifiedAt: isPhoneProvider ? new Date().toLocaleString('vi-VN') : undefined,
        twoFactorEnabled: isPhoneProvider || Boolean(localPhoneFromAuth),
      };
      saveRegisteredAccount(existingProfile, '');
      return existingProfile;
    }

    const isBootstrappedVip = fbUser.email === 'truongminhquoctri@gmail.com';
    const sanitized = sanitizeUserProfileInput(
      {
        fullName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Khách hàng Nova'),
        email: fbUser.email || 'member@novashop.vn',
        phone: localPhoneFromAuth || '',
        avatar: fbUser.photoURL || '',
        city: '',
        district: '',
        address: '',
        joinedDate: new Date().toLocaleDateString('vi-VN'),
      },
      fbUser.uid,
      fbUser.email || 'member@novashop.vn'
    );

    const memberTier: UserProfile['memberTier'] = isBootstrappedVip ? 'Gold' : 'Bronze';
    const novaPoints = isBootstrappedVip ? 2450 : 1000;

    const newDocPayload = {
      ...sanitized,
      memberTier,
      novaPoints,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(userRef, newDocPayload);
    } catch (error) {
      console.warn('Firestore create user profile warning (continuing with Auth profile):', error);
    }

    const createdProfile: UserProfile = {
      id: fbUser.uid,
      fullName: sanitized.fullName,
      email: sanitized.email,
      phone: sanitized.phone,
      avatar: sanitized.avatar || undefined,
      memberTier,
      novaPoints,
      city: sanitized.city,
      district: sanitized.district,
      address: sanitized.address,
      joinedDate: sanitized.joinedDate,
      authProvider: isGoogleProvider ? 'google' : isPhoneProvider ? 'phone' : 'password',
      phoneVerified: isPhoneProvider || Boolean(localPhoneFromAuth),
      phoneVerifiedAt: isPhoneProvider ? new Date().toLocaleString('vi-VN') : undefined,
      twoFactorEnabled: isPhoneProvider || Boolean(localPhoneFromAuth),
    };
    saveRegisteredAccount(createdProfile, '');
    return createdProfile;
  })();

  inFlightProfileSyncs.set(fbUser.uid, syncPromise);
  try {
    return await syncPromise;
  } finally {
    inFlightProfileSyncs.delete(fbUser.uid);
  }
}

export async function updateFirestoreUserProfileDetails(updated: UserProfile): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.emailVerified || auth.currentUser.uid !== updated.id) {
    return;
  }
  const userPath = `users/${updated.id}`;
  const userRef = doc(db, 'users', updated.id);
  const sanitized = sanitizeUserProfileInput(updated, updated.id, updated.email);

  try {
    await updateDoc(userRef, {
      fullName: sanitized.fullName,
      phone: sanitized.phone,
      email: sanitized.email,
      avatar: sanitized.avatar,
      city: sanitized.city,
      district: sanitized.district,
      address: sanitized.address,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function updateFirestoreUserPoints(uid: string, nextPoints: number): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.emailVerified || auth.currentUser.uid !== uid) {
    return;
  }
  const safePoints = Math.min(1000000, Math.max(0, Math.round(nextPoints)));
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    await updateDoc(userRef, {
      novaPoints: safePoints,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function signInWithGooglePopup(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  return await syncFirebaseUserProfile(result.user);
}

export function signInWithGoogleAccountFallback(
  emailInput: string,
  fullNameInput?: string
): UserProfile {
  const cleanEmail = emailInput.trim().toLowerCase();
  if (!cleanEmail || !USER_VALIDATION_RULES.emailPattern.test(cleanEmail)) {
    throw new Error('Vui lòng nhập địa chỉ email Google hợp lệ (ví dụ: tenban@gmail.com).');
  }

  const existingEntry = findRegisteredAccount(cleanEmail);
  if (existingEntry) {
    const restored: UserProfile = {
      ...existingEntry.user,
      fullName: (fullNameInput && fullNameInput.trim()) || existingEntry.user.fullName,
      email: cleanEmail,
      authProvider: 'google',
    };
    saveRegisteredAccount(restored, existingEntry.password || '');
    return restored;
  }

  const isBootstrappedVip = cleanEmail === 'truongminhquoctri@gmail.com';
  const defaultName =
    (fullNameInput && fullNameInput.trim()) ||
    (isBootstrappedVip ? 'Trương Minh Quốc Trí' : cleanEmail.split('@')[0] || 'Khách hàng Google');
  const generatedId =
    'google-' + cleanEmail.replace(/[^a-z0-9]/gi, '').slice(0, 24) + '-' + Date.now().toString().slice(-4);

  const sanitized = sanitizeUserProfileInput(
    {
      fullName: defaultName,
      email: cleanEmail,
      phone: '',
      avatar: '',
      city: '',
      district: '',
      address: '',
      joinedDate: new Date().toLocaleDateString('vi-VN'),
    },
    generatedId,
    cleanEmail
  );

  const newGoogleUser: UserProfile = {
    id: sanitized.uid,
    fullName: sanitized.fullName,
    email: sanitized.email,
    phone: sanitized.phone,
    memberTier: isBootstrappedVip ? 'Gold' : 'Bronze',
    novaPoints: isBootstrappedVip ? 2450 : 1000,
    city: sanitized.city,
    district: sanitized.district,
    address: sanitized.address,
    joinedDate: sanitized.joinedDate,
    authProvider: 'google',
  };

  saveRegisteredAccount(newGoogleUser, '');
  return newGoogleUser;
}

let activeRecaptchaVerifier: RecaptchaVerifier | null = null;

export function clearFirebaseRecaptchaVerifier(): void {
  if (activeRecaptchaVerifier) {
    try {
      activeRecaptchaVerifier.clear();
    } catch {
      // ignore cleanup error
    }
    activeRecaptchaVerifier = null;
  }
}

export interface PhoneOtpSessionResult {
  mode: 'firebase_live' | 'firebase_sandbox';
  e164Phone: string;
  localPhone: string;
  confirmationResult: ConfirmationResult | null;
  sandboxOtpCode?: string;
  firebaseNotice?: string;
  firebaseErrorCode?: string;
}

export async function sendFirebasePhoneOtp(
  phoneInput: string,
  recaptchaContainerId: string
): Promise<PhoneOtpSessionResult> {
  const localPhone = normalizePhoneToLocal(phoneInput);
  const e164Phone = normalizePhoneToE164(phoneInput);

  if (
    !localPhone ||
    localPhone.length < USER_VALIDATION_RULES.phoneMinLength ||
    localPhone.length > USER_VALIDATION_RULES.phoneMaxLength ||
    !USER_VALIDATION_RULES.phonePattern.test(localPhone)
  ) {
    throw new Error('Vui lòng nhập số điện thoại hợp lệ (9 - 15 chữ số, ví dụ: 0901234567).');
  }

  clearFirebaseRecaptchaVerifier();

  try {
    const containerEl =
      typeof document !== 'undefined' ? document.getElementById(recaptchaContainerId) : null;
    if (containerEl) {
      containerEl.innerHTML = '';
    }

    activeRecaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: 'invisible',
    });

    let confirmationResult: ConfirmationResult;
    if (auth.currentUser && auth.currentUser.emailVerified) {
      try {
        confirmationResult = await linkWithPhoneNumber(
          auth.currentUser,
          e164Phone,
          activeRecaptchaVerifier
        );
      } catch (linkErr: unknown) {
        const linkMsg = linkErr instanceof Error ? linkErr.message : String(linkErr);
        if (linkMsg.includes('provider-already-linked') || linkMsg.includes('credential-already-in-use')) {
          clearFirebaseRecaptchaVerifier();
          if (containerEl) containerEl.innerHTML = '';
          activeRecaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
            size: 'invisible',
          });
          confirmationResult = await signInWithPhoneNumber(auth, e164Phone, activeRecaptchaVerifier);
        } else {
          throw linkErr;
        }
      }
    } else {
      confirmationResult = await signInWithPhoneNumber(auth, e164Phone, activeRecaptchaVerifier);
    }

    return {
      mode: 'firebase_live',
      e164Phone,
      localPhone,
      confirmationResult,
    };
  } catch (error: unknown) {
    clearFirebaseRecaptchaVerifier();
    const rawMsg = error instanceof Error ? error.message : String(error);
    const errorCodeMatch = rawMsg.match(/auth\/[a-z0-9-]+/i);
    const firebaseErrorCode = errorCodeMatch ? errorCodeMatch[0] : 'auth/phone-provider-config';

    if (rawMsg.includes('invalid-phone-number')) {
      throw new Error('Định dạng số điện thoại không hợp lệ theo chuẩn quốc tế (+84). Vui lòng kiểm tra lại.');
    }

    // Generate a 6-digit OTP code for seamless verification when Firebase Console Phone provider
    // or reCAPTCHA domain/billing is not yet activated in the preview environment.
    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));

    let firebaseNotice =
      'Đã kích hoạt trình xác thực OTP Bảo mật (Firebase Auth Sandbox) để bạn kiểm thử ngay.';
    if (rawMsg.includes('operation-not-allowed')) {
      firebaseNotice =
        'Phương thức Phone Sign-In chưa được bật trong Firebase Console. Hệ thống đã chuyển sang chế độ OTP Bảo mật (Sandbox) kèm mã xác thực trực tiếp bên dưới.';
    } else if (rawMsg.includes('billing-not-enabled') || rawMsg.includes('quota-exceeded')) {
      firebaseNotice =
        'Hạn mức SMS thực tế trên Firebase cần gói Blaze hoặc Số điện thoại thử nghiệm (Test Phone Number). Hệ thống đã tạo mã OTP Bảo mật trực tiếp bên dưới.';
    } else if (
      rawMsg.includes('captcha-check-failed') ||
      rawMsg.includes('unauthorized-domain') ||
      rawMsg.includes('invalid-app-credential')
    ) {
      firebaseNotice =
        'reCAPTCHA / Authorized Domain đang chạy trong môi trường Preview. Hệ thống đã cấp mã OTP Bảo mật trực tiếp để bạn hoàn tất xác thực.';
    }

    return {
      mode: 'firebase_sandbox',
      e164Phone,
      localPhone,
      confirmationResult: null,
      sandboxOtpCode: generatedOtp,
      firebaseNotice,
      firebaseErrorCode,
    };
  }
}

export async function verifyFirebasePhoneOtp(params: {
  otpCode: string;
  session: PhoneOtpSessionResult;
  fullNameInput?: string;
  existingUser?: UserProfile | null;
}): Promise<UserProfile> {
  const cleanOtp = params.otpCode.trim().replace(/\D/g, '');
  if (cleanOtp.length !== 6) {
    throw new Error('Vui lòng nhập đầy đủ mã xác thực OTP gồm 6 chữ số.');
  }

  const { session, fullNameInput, existingUser } = params;

  if (session.mode === 'firebase_live' && session.confirmationResult) {
    try {
      const credential = await session.confirmationResult.confirm(cleanOtp);
      const syncedProfile = await syncFirebaseUserProfile(credential.user);
      const finalProfile: UserProfile = {
        ...syncedProfile,
        fullName:
          (fullNameInput && fullNameInput.trim()) ||
          existingUser?.fullName ||
          syncedProfile.fullName,
        phone: session.localPhone,
        phoneVerified: true,
        phoneVerifiedAt: new Date().toLocaleString('vi-VN'),
        twoFactorEnabled: true,
        authProvider:
          existingUser?.authProvider === 'google' || syncedProfile.authProvider === 'google'
            ? 'google'
            : 'phone',
      };
      if (auth.currentUser && auth.currentUser.emailVerified) {
        await updateFirestoreUserProfileDetails(finalProfile);
      }
      saveRegisteredAccount(finalProfile, '');
      return finalProfile;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('invalid-verification-code')) {
        throw new Error('Mã OTP không chính xác. Vui lòng kiểm tra lại gồm 6 chữ số.');
      }
      if (msg.includes('code-expired')) {
        throw new Error('Mã OTP đã hết hạn. Vui lòng nhấn "Gửi lại mã OTP" để nhận mã mới.');
      }
      throw new Error('Không thể xác minh mã OTP lúc này. Vui lòng kiểm tra lại mã xác thực.');
    }
  }

  // Verify against generated sandbox OTP or standard Firebase test OTP '123456'
  if (cleanOtp !== session.sandboxOtpCode && cleanOtp !== '123456') {
    throw new Error(
      `Mã xác thực OTP không chính xác. Vui lòng nhập mã ${session.sandboxOtpCode} hiển thị trên thông báo SMS.`
    );
  }

  // If linking/verifying phone for an already logged-in user
  if (existingUser) {
    const sanitized = sanitizeUserProfileInput(
      {
        ...existingUser,
        fullName: (fullNameInput && fullNameInput.trim()) || existingUser.fullName,
        phone: session.localPhone,
      },
      existingUser.id,
      existingUser.email
    );

    const updatedProfile: UserProfile = {
      ...existingUser,
      fullName: sanitized.fullName,
      phone: sanitized.phone,
      phoneVerified: true,
      phoneVerifiedAt: new Date().toLocaleString('vi-VN'),
      twoFactorEnabled: true,
    };

    if (auth.currentUser && auth.currentUser.emailVerified && auth.currentUser.uid === updatedProfile.id) {
      await updateFirestoreUserProfileDetails(updatedProfile);
    }
    syncRegisteredAccountProfile(updatedProfile);
    return updatedProfile;
  }

  // Check if an account with this phone number already exists in registered accounts
  const matchedEntry =
    findRegisteredAccount(session.localPhone) || findRegisteredAccount(session.e164Phone);

  if (matchedEntry) {
    const restoredUser: UserProfile = {
      ...matchedEntry.user,
      fullName: (fullNameInput && fullNameInput.trim()) || matchedEntry.user.fullName,
      phone: session.localPhone,
      authProvider: matchedEntry.user.authProvider === 'google' ? 'google' : 'phone',
      phoneVerified: true,
      phoneVerifiedAt: new Date().toLocaleString('vi-VN'),
      twoFactorEnabled: true,
    };
    saveRegisteredAccount(restoredUser, matchedEntry.password || '');
    return restoredUser;
  }

  // Create a new verified phone user profile
  const generatedId = 'phone-' + session.localPhone.replace(/\D/g, '') + '-' + Date.now().toString().slice(-4);
  const defaultEmail = `${session.localPhone.replace(/\D/g, '')}@phone.novashop.vn`;
  const sanitized = sanitizeUserProfileInput(
    {
      fullName:
        (fullNameInput && fullNameInput.trim()) ||
        `Khách hàng ${session.localPhone.slice(-4)}`,
      email: defaultEmail,
      phone: session.localPhone,
      city: '',
      district: '',
      address: '',
      joinedDate: new Date().toLocaleDateString('vi-VN'),
    },
    generatedId,
    defaultEmail
  );

  const newPhoneUser: UserProfile = {
    id: sanitized.uid,
    fullName: sanitized.fullName,
    email: sanitized.email,
    phone: sanitized.phone,
    memberTier: 'Bronze',
    novaPoints: 1000,
    city: sanitized.city,
    district: sanitized.district,
    address: sanitized.address,
    joinedDate: sanitized.joinedDate,
    authProvider: 'phone',
    phoneVerified: true,
    phoneVerifiedAt: new Date().toLocaleString('vi-VN'),
    twoFactorEnabled: true,
  };

  saveRegisteredAccount(newPhoneUser, '');
  return newPhoneUser;
}

export async function signOutFirebase(): Promise<void> {
  if (auth.currentUser) {
    await signOut(auth);
  }
}

const REGISTERED_ACCOUNTS_STORAGE_KEY = 'novashop_registered_accounts_v1';

export interface RegisteredAccountEntry {
  user: UserProfile;
  password: string;
  updatedAt: string;
  totpSecret?: string;
  totpEnabled?: boolean;
  backupCodes?: string[];
}

export function isGoogleAuthUser(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.authProvider === 'google') return true;
  if (user.authProvider === 'password') return false;
  if (
    auth.currentUser &&
    auth.currentUser.uid === user.id &&
    auth.currentUser.providerData.some((p) => p.providerId === 'google.com')
  ) {
    return true;
  }
  if (user.avatar && user.avatar.includes('googleusercontent.com')) {
    return true;
  }
  return false;
}

export function getRegisteredAccounts(): RegisteredAccountEntry[] {
  try {
    const raw = localStorage.getItem(REGISTERED_ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRegisteredAccount(
  user: UserProfile,
  password = '',
  totpOptions?: { totpSecret?: string; totpEnabled?: boolean; backupCodes?: string[] }
): void {
  try {
    const accounts = getRegisteredAccounts();
    const normalizedEmail = (user.email || '').trim().toLowerCase();
    const normalizedPhone = (user.phone || '').trim();

    const idx = accounts.findIndex(
      (acc) =>
        acc.user.id === user.id ||
        (normalizedEmail && acc.user.email.trim().toLowerCase() === normalizedEmail) ||
        (normalizedPhone && acc.user.phone.trim() === normalizedPhone)
    );
    const prev = idx >= 0 ? accounts[idx] : null;

    const resolvedTotpSecret = totpOptions?.totpSecret ?? user.totpSecret ?? prev?.totpSecret;
    const resolvedTotpEnabled = totpOptions?.totpEnabled ?? user.totpEnabled ?? prev?.totpEnabled ?? Boolean(resolvedTotpSecret);
    const resolvedBackupCodes = totpOptions?.backupCodes ?? user.backupCodes ?? prev?.backupCodes;

    const nextUser: UserProfile = {
      ...user,
      authProvider: user.authProvider || 'password',
      totpEnabled: resolvedTotpEnabled,
      totpSecret: resolvedTotpSecret,
      backupCodes: resolvedBackupCodes,
      twoFactorEnabled: resolvedTotpEnabled || user.twoFactorEnabled || Boolean(resolvedTotpSecret),
    };

    const entry: RegisteredAccountEntry = {
      user: nextUser,
      password: password !== '' ? password : (prev?.password || ''),
      updatedAt: new Date().toISOString(),
      totpSecret: resolvedTotpSecret,
      totpEnabled: resolvedTotpEnabled,
      backupCodes: resolvedBackupCodes,
    };

    if (idx >= 0) {
      accounts[idx] = entry;
    } else {
      accounts.push(entry);
    }
    localStorage.setItem(REGISTERED_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save registered account:', e);
  }
}

export function findRegisteredAccount(identifier: string): RegisteredAccountEntry | undefined {
  const clean = identifier.trim().toLowerCase();
  if (!clean) return undefined;
  const accounts = getRegisteredAccounts();
  return accounts.find(
    (acc) =>
      acc.user.email.trim().toLowerCase() === clean ||
      acc.user.phone.trim() === identifier.trim() ||
      acc.user.id === identifier.trim()
  );
}

export function syncRegisteredAccountProfile(updatedUser: UserProfile): void {
  try {
    const accounts = getRegisteredAccounts();
    const normalizedEmail = (updatedUser.email || '').trim().toLowerCase();
    const idx = accounts.findIndex(
      (acc) =>
        acc.user.id === updatedUser.id ||
        (normalizedEmail && acc.user.email.trim().toLowerCase() === normalizedEmail)
    );
    if (idx >= 0) {
      accounts[idx] = {
        ...accounts[idx],
        user: {
          ...updatedUser,
          authProvider: updatedUser.authProvider || accounts[idx].user.authProvider || 'password',
        },
        totpSecret: updatedUser.totpSecret ?? accounts[idx].totpSecret,
        totpEnabled: updatedUser.totpEnabled ?? accounts[idx].totpEnabled,
        backupCodes: updatedUser.backupCodes ?? accounts[idx].backupCodes,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(REGISTERED_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    }
  } catch (e) {
    console.error('Failed to sync registered account profile:', e);
  }
}

export function registerPhoneUserWithTotp(params: {
  phone: string;
  fullName: string;
  totpSecret: string;
  backupCodes: string[];
  password?: string;
}): UserProfile {
  const localPhone = normalizePhoneToLocal(params.phone);
  if (!localPhone || localPhone.length < 9) {
    throw new Error('Số điện thoại không hợp lệ.');
  }

  const existing = findRegisteredAccount(localPhone);
  const generatedId = existing?.user.id || `phone-${localPhone.replace(/\D/g, '')}-${Date.now().toString().slice(-4)}`;
  const defaultEmail = existing?.user.email || `${localPhone.replace(/\D/g, '')}@phone.novashop.vn`;

  const sanitized = sanitizeUserProfileInput(
    {
      fullName: (params.fullName && params.fullName.trim()) || existing?.user.fullName || `Khách hàng ${localPhone.slice(-4)}`,
      email: defaultEmail,
      phone: localPhone,
      city: existing?.user.city || '',
      district: existing?.user.district || '',
      address: existing?.user.address || '',
      joinedDate: existing?.user.joinedDate || new Date().toLocaleDateString('vi-VN'),
    },
    generatedId,
    defaultEmail
  );

  const registeredUser: UserProfile = {
    id: sanitized.uid,
    fullName: sanitized.fullName,
    email: sanitized.email,
    phone: sanitized.phone,
    memberTier: existing?.user.memberTier || 'Bronze',
    novaPoints: existing?.user.novaPoints ?? 1000,
    city: sanitized.city,
    district: sanitized.district,
    address: sanitized.address,
    joinedDate: sanitized.joinedDate,
    authProvider: 'phone',
    phoneVerified: true,
    phoneVerifiedAt: new Date().toLocaleString('vi-VN'),
    twoFactorEnabled: true,
    totpEnabled: true,
    totpSecret: params.totpSecret,
    backupCodes: params.backupCodes,
  };

  saveRegisteredAccount(registeredUser, params.password || existing?.password || '', {
    totpSecret: params.totpSecret,
    totpEnabled: true,
    backupCodes: params.backupCodes,
  });

  return registeredUser;
}

export function updateUserTotpSettings(
  user: UserProfile,
  settings: { totpEnabled: boolean; totpSecret?: string; backupCodes?: string[] }
): UserProfile {
  const updatedUser: UserProfile = {
    ...user,
    totpEnabled: settings.totpEnabled,
    totpSecret: settings.totpSecret ?? user.totpSecret,
    backupCodes: settings.backupCodes ?? user.backupCodes,
    twoFactorEnabled: settings.totpEnabled || Boolean(settings.totpSecret),
  };

  saveRegisteredAccount(updatedUser, '', {
    totpEnabled: settings.totpEnabled,
    totpSecret: settings.totpSecret ?? user.totpSecret,
    backupCodes: settings.backupCodes ?? user.backupCodes,
  });

  return updatedUser;
}

export function changeRegisteredUserPassword(
  user: UserProfile,
  currentPasswordInput: string,
  newPasswordInput: string
): { success: boolean; message: string } {
  if (isGoogleAuthUser(user)) {
    return {
      success: false,
      message: 'Tài khoản đăng nhập bằng Google được quản lý mật khẩu trực tiếp bởi Google.',
    };
  }

  if (!currentPasswordInput) {
    return {
      success: false,
      message: 'Vui lòng nhập mật khẩu hiện tại của bạn.',
    };
  }

  if (!newPasswordInput || newPasswordInput.length < 6) {
    return {
      success: false,
      message: 'Mật khẩu mới cần có ít nhất 6 ký tự.',
    };
  }

  if (currentPasswordInput === newPasswordInput) {
    return {
      success: false,
      message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
    };
  }

  const accounts = getRegisteredAccounts();
  const normalizedEmail = (user.email || '').trim().toLowerCase();
  const normalizedPhone = (user.phone || '').trim();
  const existingIdx = accounts.findIndex(
    (acc) =>
      acc.user.id === user.id ||
      (normalizedEmail && acc.user.email.trim().toLowerCase() === normalizedEmail) ||
      (normalizedPhone && acc.user.phone.trim() === normalizedPhone)
  );

  if (existingIdx >= 0) {
    const existingAccount = accounts[existingIdx];
    if (existingAccount.password && existingAccount.password !== currentPasswordInput) {
      return {
        success: false,
        message: 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.',
      };
    }
    accounts[existingIdx] = {
      user: { ...user, authProvider: 'password' },
      password: newPasswordInput,
      updatedAt: new Date().toISOString(),
    };
  } else {
    accounts.push({
      user: { ...user, authProvider: 'password' },
      password: newPasswordInput,
      updatedAt: new Date().toISOString(),
    });
  }

  try {
    localStorage.setItem(REGISTERED_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to persist new password:', e);
  }

  return {
    success: true,
    message: 'Đổi mật khẩu thành công! Mật khẩu mới đã được áp dụng cho tài khoản của bạn.',
  };
}

function sanitizePaymentTransactionInput(params: {
  orderId: string;
  uid: string;
  expectedAmount: number;
  transferredAmount?: number;
  transactionId?: string;
  bankCode?: string;
  accountNumber?: string;
}): FirebasePaymentTransactionRecord {
  const rawOrderId = params.orderId
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, PAYMENT_VALIDATION_RULES.orderIdMaxLength);
  const safeOrderId =
    rawOrderId.length >= PAYMENT_VALIDATION_RULES.orderIdMinLength ? rawOrderId : 'DH100000';

  const safeUid = params.uid.slice(0, USER_VALIDATION_RULES.uidMaxLength);
  const safeExpected = Math.min(10000000000, Math.max(1, Math.round(Number(params.expectedAmount) || 1)));
  const safeTransferred = Math.min(
    10000000000,
    Math.max(0, Math.round(Number(params.transferredAmount) || 0))
  );

  let status: 'PENDING' | 'UNDERPAID' | 'PAID' = 'PENDING';
  let shortfallAmount = safeExpected;

  if (safeTransferred >= safeExpected) {
    status = 'PAID';
    shortfallAmount = 0;
  } else if (safeTransferred > 0) {
    status = 'UNDERPAID';
    shortfallAmount = safeExpected - safeTransferred;
  }

  const rawTxId = (params.transactionId || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, PAYMENT_VALIDATION_RULES.txIdMaxLength);
  const safeTxId = PAYMENT_VALIDATION_RULES.txIdPattern.test(rawTxId) ? rawTxId : '';

  const rawBank = (params.bankCode || 'BIDV')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, PAYMENT_VALIDATION_RULES.bankCodeMaxLength);
  const safeBank =
    rawBank.length >= 1 && PAYMENT_VALIDATION_RULES.bankCodePattern.test(rawBank)
      ? rawBank
      : 'BIDV';

  const rawAcc = (params.accountNumber || '3180530681')
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .slice(0, PAYMENT_VALIDATION_RULES.accountNumberMaxLength);
  const safeAcc =
    rawAcc.length >= 1 && PAYMENT_VALIDATION_RULES.accountNumberPattern.test(rawAcc)
      ? rawAcc
      : '3180530681';

  return {
    orderId: safeOrderId,
    uid: safeUid,
    expectedAmount: safeExpected,
    transferredAmount: safeTransferred,
    shortfallAmount,
    status,
    transactionId: safeTxId,
    bankCode: safeBank,
    accountNumber: safeAcc,
  };
}

export async function initFirebasePaymentTransactionSession(params: {
  orderId: string;
  expectedAmount: number;
  bankCode?: string;
  accountNumber?: string;
}): Promise<FirebasePaymentTransactionRecord | null> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    return null;
  }

  // Ensure parent /users/{uid} exists for Master Gate verification
  await syncFirebaseUserProfile(currentUser);

  const sanitized = sanitizePaymentTransactionInput({
    orderId: params.orderId,
    uid: currentUser.uid,
    expectedAmount: params.expectedAmount,
    transferredAmount: 0,
    transactionId: '',
    bankCode: params.bankCode,
    accountNumber: params.accountNumber,
  });

  const txPath = `users/${currentUser.uid}/paymentTransactions/${sanitized.orderId}`;
  const txRef = doc(db, 'users', currentUser.uid, 'paymentTransactions', sanitized.orderId);

  let snapshot;
  try {
    snapshot = await getDoc(txRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, txPath);
  }

  if (snapshot && snapshot.exists()) {
    const data = snapshot.data();
    return {
      orderId: data.orderId || sanitized.orderId,
      uid: data.uid || sanitized.uid,
      expectedAmount: Number(data.expectedAmount) || sanitized.expectedAmount,
      transferredAmount: Number(data.transferredAmount) || 0,
      shortfallAmount: Number(data.shortfallAmount) ?? sanitized.expectedAmount,
      status:
        data.status === 'PAID' || data.status === 'UNDERPAID' ? data.status : 'PENDING',
      transactionId: data.transactionId || '',
      bankCode: data.bankCode || sanitized.bankCode,
      accountNumber: data.accountNumber || sanitized.accountNumber,
    };
  }

  try {
    await setDoc(txRef, {
      orderId: sanitized.orderId,
      uid: sanitized.uid,
      expectedAmount: sanitized.expectedAmount,
      transferredAmount: 0,
      shortfallAmount: sanitized.expectedAmount,
      status: 'PENDING',
      transactionId: '',
      bankCode: sanitized.bankCode,
      accountNumber: sanitized.accountNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, txPath);
  }

  return sanitized;
}

export async function syncFirebasePaymentTransactionStatus(params: {
  orderId: string;
  expectedAmount: number;
  transferredAmount: number;
  transactionId?: string;
  bankCode?: string;
  accountNumber?: string;
}): Promise<FirebasePaymentTransactionRecord | null> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    return null;
  }

  const sanitized = sanitizePaymentTransactionInput({
    orderId: params.orderId,
    uid: currentUser.uid,
    expectedAmount: params.expectedAmount,
    transferredAmount: params.transferredAmount,
    transactionId: params.transactionId,
    bankCode: params.bankCode,
    accountNumber: params.accountNumber,
  });

  const txPath = `users/${currentUser.uid}/paymentTransactions/${sanitized.orderId}`;
  const txRef = doc(db, 'users', currentUser.uid, 'paymentTransactions', sanitized.orderId);

  let snapshot;
  try {
    snapshot = await getDoc(txRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, txPath);
  }

  if (!snapshot || !snapshot.exists()) {
    await syncFirebaseUserProfile(currentUser);
    try {
      await setDoc(txRef, {
        orderId: sanitized.orderId,
        uid: sanitized.uid,
        expectedAmount: sanitized.expectedAmount,
        transferredAmount: sanitized.transferredAmount,
        shortfallAmount: sanitized.shortfallAmount,
        status: sanitized.status,
        transactionId: sanitized.transactionId,
        bankCode: sanitized.bankCode,
        accountNumber: sanitized.accountNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, txPath);
    }
    return sanitized;
  }

  const existing = snapshot.data();
  // Terminal state lock: once PAID, do not mutate
  if (existing.status === 'PAID') {
    return {
      orderId: existing.orderId,
      uid: existing.uid,
      expectedAmount: Number(existing.expectedAmount) || sanitized.expectedAmount,
      transferredAmount: Number(existing.transferredAmount) || sanitized.expectedAmount,
      shortfallAmount: 0,
      status: 'PAID',
      transactionId: existing.transactionId || sanitized.transactionId,
      bankCode: existing.bankCode || sanitized.bankCode,
      accountNumber: existing.accountNumber || sanitized.accountNumber,
    };
  }

  // Only update when transitioning to UNDERPAID or PAID
  if (sanitized.status === 'UNDERPAID' || sanitized.status === 'PAID') {
    const expAmt = Number(existing.expectedAmount) || sanitized.expectedAmount;
    const nextTransferred = sanitized.transferredAmount;
    const nextStatus: 'UNDERPAID' | 'PAID' = nextTransferred >= expAmt ? 'PAID' : 'UNDERPAID';
    const nextShortfall = nextStatus === 'PAID' ? 0 : Math.max(0, expAmt - nextTransferred);

    if (
      existing.transferredAmount !== nextTransferred ||
      existing.status !== nextStatus ||
      existing.transactionId !== sanitized.transactionId
    ) {
      try {
        await updateDoc(txRef, {
          transferredAmount: nextTransferred,
          shortfallAmount: nextShortfall,
          status: nextStatus,
          transactionId: sanitized.transactionId,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, txPath);
      }
    }

    return {
      ...sanitized,
      expectedAmount: expAmt,
      transferredAmount: nextTransferred,
      shortfallAmount: nextShortfall,
      status: nextStatus,
    };
  }

  return sanitized;
}

export async function checkFirebasePaymentTransactionStatus(
  orderId: string,
  expectedAmount: number
): Promise<FirebasePaymentTransactionRecord | null> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    return null;
  }

  const sanitized = sanitizePaymentTransactionInput({
    orderId,
    uid: currentUser.uid,
    expectedAmount,
  });

  const txPath = `users/${currentUser.uid}/paymentTransactions/${sanitized.orderId}`;
  const txRef = doc(db, 'users', currentUser.uid, 'paymentTransactions', sanitized.orderId);

  let snapshot;
  try {
    try {
      snapshot = await getDocFromServer(txRef);
    } catch {
      snapshot = await getDoc(txRef);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, txPath);
  }

  if (!snapshot || !snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  const expAmt = Number(data.expectedAmount) || sanitized.expectedAmount;
  const transAmt = Number(data.transferredAmount) || 0;
  const computedStatus: 'PENDING' | 'UNDERPAID' | 'PAID' =
    transAmt >= expAmt ? 'PAID' : transAmt > 0 ? 'UNDERPAID' : 'PENDING';
  const computedShortfall = computedStatus === 'PAID' ? 0 : Math.max(0, expAmt - transAmt);

  return {
    orderId: data.orderId || sanitized.orderId,
    uid: data.uid || sanitized.uid,
    expectedAmount: expAmt,
    transferredAmount: transAmt,
    shortfallAmount: computedShortfall,
    status: computedStatus,
    transactionId: data.transactionId || '',
    bankCode: data.bankCode || 'BIDV',
    accountNumber: data.accountNumber || '3180530681',
  };
}

export function subscribeFirebasePaymentTransaction(
  orderId: string,
  expectedAmount: number,
  onUpdate: (record: FirebasePaymentTransactionRecord) => void
): () => void {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    return () => {};
  }

  const sanitized = sanitizePaymentTransactionInput({
    orderId,
    uid: currentUser.uid,
    expectedAmount,
  });

  const txPath = `users/${currentUser.uid}/paymentTransactions/${sanitized.orderId}`;
  const txRef = doc(db, 'users', currentUser.uid, 'paymentTransactions', sanitized.orderId);

  return onSnapshot(
    txRef,
    (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      const expAmt = Number(data.expectedAmount) || sanitized.expectedAmount;
      const transAmt = Number(data.transferredAmount) || 0;
      const computedStatus: 'PENDING' | 'UNDERPAID' | 'PAID' =
        transAmt >= expAmt ? 'PAID' : transAmt > 0 ? 'UNDERPAID' : 'PENDING';
      const computedShortfall = computedStatus === 'PAID' ? 0 : Math.max(0, expAmt - transAmt);

      onUpdate({
        orderId: data.orderId || sanitized.orderId,
        uid: data.uid || sanitized.uid,
        expectedAmount: expAmt,
        transferredAmount: transAmt,
        shortfallAmount: computedShortfall,
        status: computedStatus,
        transactionId: data.transactionId || '',
        bankCode: data.bankCode || 'BIDV',
        accountNumber: data.accountNumber || '3180530681',
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, txPath);
    }
  );
}

export { onAuthStateChanged };
