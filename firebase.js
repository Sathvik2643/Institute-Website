/* ================= FIREBASE ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  addDoc
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

/* ================= HELPERS ================= */
const emailInput = () => document.getElementById("email")?.value || "";
const passwordInput = () => document.getElementById("password")?.value || "";
const errorBox = () => document.getElementById("errorMsg");

/* ================= LOGIN (FIXED) ================= */
window.loginUser = async () => {
  const email = emailInput();
  const password = passwordInput();
  const err = errorBox();

  err.textContent = "";

  if (!email || !password) {
    err.textContent = "Enter email and password";
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    if (!cred.user.emailVerified) {
      err.textContent = "Please verify your email first";
      return;
    }

    const snap = await getDoc(doc(db, "users", cred.user.uid));

    if (!snap.exists()) {
      err.textContent = "User record not found";
      return;
    }

    const role = snap.data().role;

    if (role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "student.html";
    }

  } catch (e) {
    err.textContent = "Invalid email or password";
  }
};

/* ================= REGISTER ================= */
window.registerUser = async () => {
  const email = emailInput();
  const password = passwordInput();
  const err = errorBox();

  if (password.length < 6) {
    err.textContent = "Password must be at least 6 characters";
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      role: "student",
      courses: []
    });

    await sendEmailVerification(cred.user);
    err.textContent = "Verification email sent";

  } catch {
    err.textContent = "Registration failed";
  }
};

/* ================= LOGOUT ================= */
window.logoutUser = async () => {
  await signOut(auth);
  location.href = "index.html";
};

/* ================= ADMIN FUNCTIONS (UNCHANGED) ================= */
window.changeUserRole = (id, role) =>
  setDoc(doc(db,"users",id),{role},{merge:true}).then(()=>location.reload());

window.deleteUser = id =>
  confirm("Delete user?") &&
  deleteDoc(doc(db,"users",id)).then(()=>location.reload());

window.addCourse = async () => {
  await addDoc(collection(db,"courses"), {
    name: courseName.value,
    description: courseDesc.value
  });
  courseName.value = courseDesc.value = "";
};
