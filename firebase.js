/* ================= FIREBASE ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ================= CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyAdAEDwbkapoWf5FRWywQ3Lc_yee2fLbck",
  authDomain: "project1-27eeb.firebaseapp.com",
  projectId: "project1-27eeb"
};

/* ================= INIT ================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= DOM ================= */
const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("errorMsg");
const registerBtn = document.getElementById("registerUser");
const forgotBtn = document.getElementById("forgotPassword");

/* ================= LOGIN ================= */
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";

  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );

    if (!cred.user.emailVerified) {
      errorMsg.textContent = "Please verify your email before login.";
      return;
    }

    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (!snap.exists()) {
      errorMsg.textContent = "User record not found.";
      return;
    }

    const role = snap.data().role;
    window.location.href =
      role === "admin" ? "admin.html" : "student.html";

  } catch {
    errorMsg.textContent = "Invalid email or password.";
  }
});

/* ================= REGISTER ================= */
registerBtn?.addEventListener("click", async () => {
  errorMsg.textContent = "";

  if (passwordInput.value.length < 6) {
    errorMsg.textContent = "Password must be at least 6 characters.";
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );

    await setDoc(doc(db, "users", cred.user.uid), {
      email: emailInput.value,
      role: "student",
      courses: []
    });

    await sendEmailVerification(cred.user);
    errorMsg.textContent =
      "Registration successful. Verification email sent.";

  } catch {
    errorMsg.textContent = "Registration failed.";
  }
});

/* ================= FORGOT PASSWORD ================= */
forgotBtn?.addEventListener("click", async () => {
  if (!emailInput.value) {
    errorMsg.textContent = "Enter your email to reset password.";
    return;
  }

  try {
    await sendPasswordResetEmail(auth, emailInput.value);
    errorMsg.textContent = "Password reset email sent.";
  } catch {
    errorMsg.textContent = "Failed to send reset email.";
  }
});

/* ================= LOGOUT (USED ELSEWHERE) ================= */
window.logoutUser = async () => {
  await signOut(auth);
  location.href = "index.html";
};
