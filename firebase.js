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
  getDoc,
  collection,
  getDocs
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

// REGISTER
window.registerUser = async () => {
  const email = emailInput();
  const password = passwordInput();
  const role = document.getElementById("role").value;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      role
    });
    alert("Registered as " + role);
  } catch (e) {
    alert(e.message);
  }
};

// LOGIN
window.loginUser = async () => {
  try {
    const email = emailInput();
    const password = passwordInput();
    const cred = await signInWithEmailAndPassword(auth, email, password);

    const snap = await getDoc(doc(db, "users", cred.user.uid));
    const role = snap.data().role;

    closeLogin();

    if (role === "student") showSection("student");
    if (role === "employee") showSection("courses");

    if (role === "admin") {
      document.getElementById("admin").style.display = "block";
      showSection("admin");
      loadUsers();
    }
  } catch (e) {
    alert(e.message);
  }
};

function emailInput() {
  return document.getElementById("email").value;
}
function passwordInput() {
  return document.getElementById("password").value;
}

// ADMIN LOAD USERS
window.loadUsers = async () => {
  const table = document.getElementById("userTable");
  const snapshot = await getDocs(collection(db, "users"));

  snapshot.forEach(d => {
    const row = table.insertRow(-1);
    row.insertCell(0).innerText = d.data().email;
    row.insertCell(1).innerText = d.data().role;
  });
};
