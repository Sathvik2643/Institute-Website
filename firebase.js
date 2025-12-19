/* ================= FIREBASE ================= */
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

/* ================= DOM (LOGIN PAGE) ================= */
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

/* ================= LOGOUT ================= */
window.logoutUser = async () => {
  await signOut(auth);
  location.href = "index.html";
};

/* =========================================================
   =============== ADMIN / STUDENT DASHBOARD ===============
   ========================================================= */

let allUsers = [];
let currentView = null;

/* ===== AUTH GUARD + LOAD ADMIN DATA ===== */
onAuthStateChanged(auth, async user => {
  if (!user) return;

  /* ADMIN PAGE */
  if (location.pathname.includes("admin.html")) {

    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists() || snap.data().role !== "admin") {
      alert("Access denied");
      location.href = "login.html";
      return;
    }

    const usersSnap = await getDocs(collection(db, "users"));
    allUsers = [];

    let students = 0;
    let admins = 0;

    usersSnap.forEach(d => {
      const data = d.data();
      allUsers.push({ id: d.id, ...data });
      if (data.role === "student") students++;
      if (data.role === "admin") admins++;
    });

    /* COUNTS (RESTORED) */
    document.getElementById("totalStudents").innerText = students;
    document.getElementById("totalAdmins").innerText = admins;

    const totalEl = document.getElementById("totalUsers");
    if (totalEl) totalEl.innerText = students + admins;

    loadCourses();
    loadStudents();
  }

  /* STUDENT PAGE */
  if (document.getElementById("studentEmail")) {
    document.getElementById("studentEmail").innerText = user.email;
    loadStudentCourses(user.uid);
  }
});

/* ================= USER LIST TOGGLE ================= */
window.toggleUserList = role => {
  const box = document.getElementById("userListContainer");
  const search = document.getElementById("studentSearch");

  if (currentView === role) {
    box.style.display = "none";
    search.style.display = "none";
    currentView = null;
    return;
  }

  currentView = role;
  box.style.display = "block";
  search.style.display = role === "student" ? "block" : "none";

  renderUsers(allUsers.filter(u => u.role === role));
};

/* ================= SEARCH STUDENTS ================= */
window.searchStudents = txt => {
  renderUsers(
    allUsers.filter(
      u =>
        u.role === "student" &&
        u.email.toLowerCase().includes(txt.toLowerCase())
    )
  );
};

/* ================= RENDER USERS ================= */
function renderUsers(users) {
  const table = document.getElementById("userTable");
  table.innerHTML = "";

  users.forEach(u => {
    table.innerHTML += `
      <tr>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>
          <select onchange="changeUserRole('${u.id}', this.value)">
            <option value="student" ${u.role==="student"?"selected":""}>Student</option>
            <option value="admin" ${u.role==="admin"?"selected":""}>Admin</option>
          </select>
        </td>
        <td>
          <button class="btn danger" onclick="deleteUser('${u.id}')">Delete</button>
        </td>
      </tr>`;
  });
}

window.changeUserRole = async (id, role) => {
  await setDoc(doc(db, "users", id), { role }, { merge: true });
  location.reload();
};

window.deleteUser = async id => {
  if (!confirm("Delete user?")) return;
  await deleteDoc(doc(db, "users", id));
  location.reload();
};

/* ================= COURSES ================= */
async function loadCourses() {
  const list = document.getElementById("courseList");
  const select = document.getElementById("courseSelect");
  if (!list || !select) return;

  list.innerHTML = "";
  select.innerHTML = `<option value="">Select Course</option>`;

  const snap = await getDocs(collection(db, "courses"));
  snap.forEach(d => {
    const c = d.data();

    list.innerHTML += `
      <li style="margin-bottom:10px">
        <strong>${c.name}</strong><br>
        <small>${c.description}</small><br>
        <button class="btn" onclick="editCourse('${d.id}', '${c.name}', '${c.description}')">Edit</button>
        <button class="btn danger" onclick="deleteCourse('${d.id}')">Delete</button>
      </li>
    `;

    select.innerHTML += `<option value="${d.id}">${c.name}</option>`;
  });
}


window.addCourse = async () => {
  await addDoc(collection(db, "courses"), {
    name: courseName.value,
    description: courseDesc.value
  });
  courseName.value = courseDesc.value = "";
  loadCourses();
};

window.editCourse = async (id, name, desc) => {
  const newName = prompt("Edit course name:", name);
  const newDesc = prompt("Edit description:", desc);

  if (!newName || !newDesc) return;

  await setDoc(
    doc(db, "courses", id),
    { name: newName, description: newDesc },
    { merge: true }
  );

  loadCourses();
};
window.deleteCourse = async (id) => {
  if (!confirm("Delete this course?")) return;
  await deleteDoc(doc(db, "courses", id));
  loadCourses();
};

async function loadStudents() {
  const select = document.getElementById("studentSelect");
  if (!select) return;

  select.innerHTML = "";
  const snap = await getDocs(collection(db, "users"));
  snap.forEach(d => {
    if (d.data().role === "student") {
      select.innerHTML += `<option value="${d.id}">${d.data().email}</option>`;
    }
  });
}

window.assignCourse = async () => {
  if (!studentSelect.value || !courseSelect.value) {
    alert("Select student and course");
    return;
  }

  const ref = doc(db, "users", studentSelect.value);
  const snap = await getDoc(ref);
  const courses = snap.data().courses || [];

  if (!courses.includes(courseSelect.value)) {
    courses.push(courseSelect.value);
    await setDoc(ref, { courses }, { merge: true });
    alert("Course assigned");
  }

  /* RESET DROPDOWNS */
  studentSelect.value = "";
  courseSelect.value = "";
  studentSelect.style.display = "none";
  courseSelect.style.display = "none";
};


/* ================= CERTIFICATES (RESTORED) ================= */
window.addCertificate = async () => {
  const id = certId.value.trim();
  const email = certEmail.value.trim();
  const course = certCourse.value.trim();
  let link = certLink.value.trim();

  if (!id || !email || !link) {
    alert("Fill all required fields");
    return;
  }

  const match = link.match(/\/d\/([^/]+)/);
  if (match && match[1]) {
    link = `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }

  await setDoc(doc(db, "certificates", id), {
    studentEmail: email,
    course,
    fileUrl: link
  });

  /* RESET FORM */
  certId.value = "";
  certEmail.value = "";
  certCourse.value = "";
  certLink.value = "";

  alert("Certificate added");
};


/* ================= STUDENT COURSES ================= */
async function loadStudentCourses(uid) {
  const box = document.getElementById("studentCourses");
  if (!box) return;

  const snap = await getDoc(doc(db, "users", uid));
  const ids = snap.data().courses || [];

  box.innerHTML = "";
  for (const id of ids) {
    const c = await getDoc(doc(db, "courses", id));
    if (c.exists()) {
      box.innerHTML += `<p>${c.data().name}</p>`;
    }
  }
}
