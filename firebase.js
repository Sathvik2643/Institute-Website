/* ================= FIREBASE IMPORTS ================= */
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
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyAdAEDwbkapoWf5FRWywQ3Lc_yee2fLbck",
  authDomain: "project1-27eeb.firebaseapp.com",
  projectId: "project1-27eeb",
  storageBucket: "project1-27eeb.appspot.com",
  messagingSenderId: "372685998416",
  appId: "1:372685998416:web:ed24ead6124ef88c028455"
};

/* ================= INIT ================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= HELPERS ================= */
function emailInput() {
  return document.getElementById("email")?.value || "";
}
function passwordInput() {
  return document.getElementById("password")?.value || "";
}
function errorBox() {
  return document.getElementById("errorMsg");
}

/* ================= REGISTER ================= */
window.registerUser = async () => {
  const email = emailInput();
  const password = passwordInput();
  const err = errorBox();
  if (!err) return;

  err.textContent = "";
  err.style.color = "red";

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
  } catch {
    err.textContent = "Registration failed.";
  }
};

/* ================= LOGIN ================= */
window.loginUser = async () => {
  const email = emailInput();
  const password = passwordInput();
  const err = errorBox();
  if (!err) return;

  err.textContent = "";
  err.style.color = "red";

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

    const userRef = doc(db, "users", cred.user.uid);
    let snap = await getDoc(userRef);

    // Auto-create user record if missing
    if (!snap.exists()) {
      await setDoc(userRef, {
        email: cred.user.email,
        role: "student",
        courses: []
      });
      snap = await getDoc(userRef);
    }

    const role = snap.data().role;
    location.href = role === "admin" ? "./admin.html" : "./student.html";

  } catch {
    err.textContent = "Invalid email or password.";
  }
};

/* ================= FORGOT PASSWORD ================= */
window.forgotPassword = async () => {
  const email = emailInput();
  const err = errorBox();
  if (!err) return;

  if (!email) {
    err.textContent = "Enter email to reset password.";
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    err.textContent = "Password reset link sent.";
  } catch {
    err.textContent = "Failed to send reset email.";
  }
};

/* ================= LOGOUT ================= */
window.logoutUser = async () => {
  await signOut(auth);
  location.href = "./index.html";
};

/* ================= STUDENT DASHBOARD ================= */
onAuthStateChanged(auth, async user => {
  if (!user || !document.getElementById("studentEmail")) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return;

  document.getElementById("studentEmail").innerText = user.email;

  const list = document.getElementById("courseList");
  list.innerHTML = "";
  (snap.data().courses || []).forEach(c => {
    const li = document.createElement("li");
    li.textContent = c;
    list.appendChild(li);
  });
});

/* ================= ADMIN DASHBOARD ================= */
let allUsersCache = [];
let currentFilter = null;

onAuthStateChanged(auth, async user => {
  if (!user || !location.pathname.includes("admin.html")) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || snap.data().role !== "admin") {
    alert("Access denied");
    location.href = "./login.html";
    return;
  }

  // Load users
  const usersSnap = await getDocs(collection(db, "users"));
  allUsersCache = [];

  let total = 0, students = 0, admins = 0;
  usersSnap.forEach(d => {
    const data = d.data();
    allUsersCache.push({ id: d.id, ...data });
    total++;
    if (data.role === "student") students++;
    if (data.role === "admin") admins++;
  });

  document.getElementById("totalUsers").innerText = total;
  document.getElementById("totalStudents").innerText = students;
  document.getElementById("totalAdmins").innerText = admins;

  loadCourses();
});

/* ================= USER LIST FILTER ================= */
window.filterUsers = (role) => {
  const container = document.getElementById("userListContainer");

  if (currentFilter === role && container.style.display === "block") {
    container.style.display = "none";
    currentFilter = null;
    return;
  }

  currentFilter = role;
  container.style.display = "block";

  renderUserTable(
    role ? allUsersCache.filter(u => u.role === role) : allUsersCache
  );
};

function renderUserTable(users) {
  const table = document.getElementById("userTable");
  table.innerHTML = "";

  users.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>
        <select onchange="changeUserRole('${u.id}', this.value)">
          <option value="student" ${u.role === "student" ? "selected" : ""}>Student</option>
          <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
        </select>
      </td>
      <td>
        <button onclick="deleteUserFirestore('${u.id}')">Delete</button>
      </td>
    `;
    table.appendChild(tr);
  });
}

window.changeUserRole = async (uid, role) => {
  await setDoc(doc(db, "users", uid), { role }, { merge: true });
  alert("Role updated");
  location.reload();
};

window.deleteUserFirestore = async (uid) => {
  if (!confirm("Delete this user?")) return;
  await deleteDoc(doc(db, "users", uid));
  alert("User deleted");
  location.reload();
};

/* ================= COURSE MANAGEMENT ================= */
window.addCourse = async () => {
  const name = document.getElementById("courseName").value;
  const desc = document.getElementById("courseDesc").value;

  if (!name) {
    alert("Enter course name");
    return;
  }

  await addDoc(collection(db, "courses"), {
    name,
    description: desc
  });

  document.getElementById("courseName").value = "";
  document.getElementById("courseDesc").value = "";

  alert("Course added");
  loadCourses();
};

async function loadCourses() {
  const list = document.getElementById("courseList");
  if (!list) return;

  const snap = await getDocs(collection(db, "courses"));
  list.innerHTML = "";

  snap.forEach(docu => {
    const li = document.createElement("li");
    li.textContent = docu.data().name;
    list.appendChild(li);
  });
}

/* ================= CERTIFICATE MANAGEMENT ================= */
window.addCertificate = async () => {
  const id = document.getElementById("certId").value;
  const email = document.getElementById("certEmail").value;
  const course = document.getElementById("certCourse").value;
  const link = document.getElementById("certLink").value;

  if (!id || !email || !link) {
    alert("Fill all required fields");
    return;
  }

  await setDoc(doc(db, "certificates", id), {
    studentEmail: email,
    course,
    fileUrl: link
  });

  alert("Certificate added");
};
