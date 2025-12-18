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

    const userRef = doc(db, "users", cred.user.uid);
    let snap = await getDoc(userRef);

    // ✅ AUTO-CREATE USER RECORD IF MISSING
    if (!snap.exists()) {
      await setDoc(userRef, {
        email: cred.user.email,
        role: "student",     // default role
        courses: []
      });
      snap = await getDoc(userRef);
    }

    const role = snap.data().role;

    // ✅ ROLE-BASED REDIRECT
    if (role === "admin") {
      window.location.href = "./admin.html";
    } else if (role === "student") {
      window.location.href = "./student.html";
    } else {
      err.textContent = "Access denied.";
    }

  } catch (e) {
    if (
      e.code === "auth/invalid-credential" ||
      e.code === "auth/user-not-found" ||
      e.code === "auth/wrong-password"
    ) {
      err.textContent = "Invalid email or password.";
    } else if (e.code === "auth/invalid-email") {
      err.textContent = "Invalid email format.";
    } else if (e.code === "auth/too-many-requests") {
      err.textContent = "Too many attempts. Try again later.";
    } else {
      err.textContent = "Login failed. Please try again.";
    }
  }
};

/* ================= FORGOT PASSWORD ================= */
window.forgotPassword = async () => {
  const email = emailInput();
  const err = errorBox();
  if (!err) return;

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
    err.textContent = "Failed to send reset email.";
  }
};

/* ================= STUDENT DASHBOARD ================= */
onAuthStateChanged(auth, async user => {
  if (user && document.getElementById("studentEmail")) {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return;

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

/* ================= LOGOUT ================= */
window.logoutUser = async () => {
  await signOut(auth);
  window.location.href = "./index.html";
};

/* ================= ADMIN DASHBOARD ================= */
onAuthStateChanged(auth, async user => {
  if (!user) return;

  if (!window.location.pathname.includes("admin.html")) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || snap.data().role !== "admin") {
    alert("Access denied");
    window.location.href = "./login.html";
    return;
  }

  const usersSnap = await getDocs(collection(db, "users"));

  let total = 0, students = 0, admins = 0;
  const table = document.getElementById("userTable");
  table.innerHTML = "";

  usersSnap.forEach(docu => {
    total++;
    const data = docu.data();

    if (data.role === "student") students++;
    if (data.role === "admin") admins++;

   const tr = document.createElement("tr");
    tr.innerHTML = `
    <td>${data.email}</td>
    <td>${data.role}</td>
    <td>
    <select onchange="changeUserRole('${docu.id}', this.value)">
      <option value="student" ${data.role === "student" ? "selected" : ""}>Student</option>
      <option value="admin" ${data.role === "admin" ? "selected" : ""}>Admin</option>
    </select>
    </td>
    `;
    table.appendChild(tr);

  });

  /* ================= CHANGE USER ROLE (ADMIN) ================= */
window.changeUserRole = async (uid, newRole) => {
  try {
    await setDoc(
      doc(db, "users", uid),
      { role: newRole },
      { merge: true }
    );
    alert("Role updated successfully");
    location.reload();
  } catch (err) {
    alert("Failed to update role");
  }
};


  document.getElementById("totalUsers").innerText = total;
  document.getElementById("totalStudents").innerText = students;
  document.getElementById("totalAdmins").innerText = admins;
});
