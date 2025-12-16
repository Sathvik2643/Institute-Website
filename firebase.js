import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔥 FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyAdAEDwbkapoWf5FRWywQ3Lc_yee2fLbck",
  authDomain: "project1-27eeb.firebaseapp.com",
  projectId: "project1-27eeb",
  storageBucket: "project1-27eeb.appspot.com",
  messagingSenderId: "372685998416",
  appId: "1:372685998416:web:ed24ead6124ef88c028455"
};

// INIT
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

//////////////////// REGISTER ////////////////////
window.registerUser = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  if (!email || !password) {
    alert("Enter email & password");
    return;
  }

  if (role === "admin") {
    alert("Admin accounts are created manually.");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", cred.user.uid), {
      email: email,
      role: role
    });

    alert(role.toUpperCase() + " registered successfully");
  } catch (e) {
    alert(e.message);
  }
};

//////////////////// LOGIN ////////////////////
window.loginUser = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    const snap = await getDoc(doc(db, "users", cred.user.uid));
    const role = snap.exists() ? snap.data().role : "student";

    alert("Login successful as " + role.toUpperCase());
    closeLogin();

    if (role === "student") showSection("student");
    if (role === "employee") showSection("courses");
    if (role === "admin") showSection("home");

  } catch (e) {
    alert(e.message);
  }
};
