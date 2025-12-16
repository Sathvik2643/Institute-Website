import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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

/* REGISTER (ACCOUNT) */
window.registerUser = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", cred.user.uid), {
    email: email,
    role: "student",
    courses: []
  });

  alert("Registration successful. You can now login.");
};

/* LOGIN */
window.loginUser = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "users", cred.user.uid));

  if (snap.data().role !== "student") {
    alert("Only students are allowed");
    return;
  }

  window.location.href = "student.html";
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
  window.location.href = "index.html";
};
