import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAdAEDwbkapoWf5FRWywQ3Lc_yee2fLbck",
  authDomain: "project1-27eeb.firebaseapp.com",
  projectId: "project1-27eeb",
  storageBucket: "project1-27eeb.appspot.com",
  messagingSenderId: "372685998416",
  appId: "1:372685998416:web:ed24ead6124ef88c028455"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* HELPERS */
function emailInput() {
  return document.getElementById("email").value;
}
function passwordInput() {
  return document.getElementById("password").value;
}
function errorBox() {
  return document.getElementById("errorMsg");
}

/* REGISTER */
window.registerUser = async () => {
  const email = emailInput();
  const password = passwordInput();
  const err = errorBox();
  err.style.color = "red";
  err.textContent = "";

  if (!email || !password) {
    err.textContent = "Please enter email and password";
    return;
  }

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

    err.style.color = "green";
    err.textContent =
      "Registration successful. Verification email sent. Please verify before login.";

  } catch (e) {
    if (e.code === "auth/email-already-in-use") {
      err.textContent = "Email already registered. Please login.";
    } else if (e.code === "auth/invalid-email") {
      err.textContent = "Invalid email format.";
    } else {
      err.textContent = e.message;
    }
  }
};

/* LOGIN */
window.loginUser = async () => {
  const email = emailInput();
  const password = passwordInput();
  const err = errorBox();
  err.style.color = "red";
  err.textContent = "";

  if (!email || !password) {
    err.textContent = "Please enter email and password";
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    if (!cred.user.emailVerified) {
      err.textContent = "Email not verified. Please check your inbox.";
      return;
    }

    const snap = await getDoc(doc(db, "users", cred.user.uid));

    if (!snap.exists() || snap.data().role !== "student") {
      err.textContent = "Only students are allowed.";
      return;
    }

    window.location.href = "./student.html";

  } catch (e) {
    if (e.code === "auth/user-not-found") {
      err.textContent = "User not registered. Please register.";
    } else if (e.code === "auth/wrong-password") {
      err.textContent = "Incorrect password.";
    } else if (e.code === "auth/invalid-email") {
      err.textContent = "Invalid email format.";
    } else if (e.code === "auth/too-many-requests") {
      err.textContent = "Too many attempts. Try again later.";
    } else {
      err.textContent = e.message;
    }
  }
};

/* FORGOT PASSWORD */
window.forgotPassword = async () => {
  const email = emailInput();
  const err = errorBox();
  err.style.color = "green";
  err.textContent = "";

  if (!email) {
    err.style.color = "red";
    err.textContent = "Enter your email to reset password.";
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    err.textContent = "Password reset link sent to your email.";
  } catch (e) {
    err.style.color = "red";
    err.textContent = e.message;
  }
};

/* STUDENT DASHBOARD LOAD */
onAuthStateChanged(auth, async user => {
  if (user && document.getElementById("studentEmail")) {
    const snap = await getDoc(doc(db, "users", user.uid));
    document.getElementById("studentEmail").innerText = user.email;

    const courses = snap.data().courses || [];
    const ul = document.getElementById("courseList");
    ul.innerHTML = "";
    courses.forEach(c => {
      const li = document.createElement("li");
      li.textContent = c;
      ul.appendChild(li);
    });
  }
});

/* LOGOUT */
window.logoutUser = async () => {
  await signOut(auth);
  window.location.href = "./index.html";
};
