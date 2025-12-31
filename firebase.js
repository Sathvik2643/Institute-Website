/* ================= FIREBASE IMPORTS ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
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

/* ================= GLOBAL ================= */
let allUsers = [];
let allCourses = [];
let currentUserTab = null;

/* ================= LOGIN HANDLER ================= */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorMsg = document.getElementById("errorMsg");

  form.addEventListener("submit", async e => {
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
      }
    } catch {
      errorMsg.textContent = "Invalid email or password.";
    }
  });
});

/* ================= LOGOUT ================= */
window.logoutUser = async () => {
  await signOut(auth);
  location.href = "index.html";
};

/* ================= AUTH ROUTER ================= */
onAuthStateChanged(auth, async user => {
  if (!user) {
    if (location.pathname.includes("admin") || location.pathname.includes("student")) {
      location.href = "index.html";
    }
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) {
    location.href = "index.html";
    return;
  }

  const role = snap.data().role;

  if (
    location.pathname.includes("index") ||
    location.pathname.includes("login") ||
    location.pathname === "/"
  ) {
    location.href = role === "admin" ? "admin.html" : "student.html";
    return;
  }

  if (location.pathname.includes("admin") && role !== "admin") {
    location.href = "student.html";
    return;
  }

  if (location.pathname.includes("admin")) {
    loadUsers();
    loadCourses();
  }
});

/* ================= USER MANAGEMENT ================= */
async function loadUsers() {
  const snap = await getDocs(collection(db, "users"));
  allUsers = [];
  let students = 0, admins = 0;

  snap.forEach(d => {
    const u = d.data();
    allUsers.push({ id: d.id, ...u });
    if (u.role === "student") students++;
    if (u.role === "admin") admins++;
  });

  totalStudents.innerText = students;
  totalAdmins.innerText = admins;

  if (currentUserTab) {
    renderUsers(allUsers.filter(u => u.role === currentUserTab));
  }

  loadStudentsForAssign();
  loadCertSelectors();
}

function renderUsers(users) {
  userTable.innerHTML = "";

  users.forEach(u => {

    // View button ONLY for students
    const viewBtn = u.role === "student"
      ? `<button class="btn" onclick="viewStudent('${u.id}')">View</button>`
      : "";

    userTable.innerHTML += `
      <tr>
        <td>${u.studentId || "-"}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${viewBtn}</td>
        <td>
          <button class="btn danger" onclick="deleteUser('${u.id}')">
            Delete
          </button>
        </td>
      </tr>
    `;
  });
}

window.viewStudent = async (userId) => {
  const overlay = document.getElementById("studentOverlay");
  const content = document.getElementById("studentDashboardContent");

  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return alert("Student not found");

  const u = snap.data();

  overlay.style.display = "block";

  content.innerHTML = `
    <h2>Student Dashboard</h2>
    <p><strong>Student ID:</strong> ${u.studentId || "-"}</p>
    <p><strong>Email:</strong> ${u.email}</p>

    <h3>Enrolled Courses</h3>
    <ul>
      ${(u.courses || []).map(c => `<li>${c}</li>`).join("") || "<li>None</li>"}
    </ul>
  `;
};

window.closeStudentView = () => {
  document.getElementById("studentOverlay").style.display = "none";
};


/* Toggle student/admin tabs */
window.toggleUserList = role => {
  const container = document.getElementById("userListContainer");
  const search = document.getElementById("studentSearch");

  if (!container || !search) return;

  // If same tab clicked again → close
  if (currentUserTab === role) {
    container.style.display = "none";
    search.style.display = "none";
    currentUserTab = null;
    return;
  }

  // Open user management
  currentUserTab = role;
  container.style.display = "block";

  if (role === "student") {
    search.style.display = "block";
    renderUsers(allUsers.filter(u => u.role === "student"));
  } else {
    search.style.display = "none";
    renderUsers(allUsers.filter(u => u.role === "admin"));
  }
};


window.searchStudentsById = txt => {
  renderUsers(
    allUsers.filter(
      u =>
        u.role === "student" &&
        u.studentId &&
        u.studentId.toLowerCase().includes(txt.toLowerCase())
    )
  );
};

window.changeUserRole = async (id, role) => {
  await setDoc(doc(db,"users",id),{role},{merge:true});
  loadUsers();
};

window.deleteUser = async id => {
  if (!confirm("Delete user?")) return;
  await deleteDoc(doc(db,"users",id));
  loadUsers();
};

/* ================= STUDENT ID GENERATOR ================= */
window.assignStudentIds = async () => {
  const prefix = idPrefix.value.trim();
  let start = parseInt(idStart.value, 10);
  if (!prefix || isNaN(start)) return alert("Invalid input");

  for (const u of allUsers) {
    if (u.role === "student" && !u.studentId) {
      await setDoc(
        doc(db,"users",u.id),
        { studentId: `${prefix}-${String(start).padStart(3,"0")}` },
        { merge:true }
      );
      start++;
    }
  }
  loadUsers();
};

/* ================= COURSE MANAGEMENT ================= */
window.addCourse = async () => {
  if (!courseId.value || !courseName.value) return alert("Missing fields");

  await addDoc(collection(db,"courses"),{
    courseId: courseId.value.toUpperCase(),
    name: courseName.value,
    description: courseDesc.value
  });

  courseId.value = courseName.value = courseDesc.value = "";
  loadCourses();
};

async function loadCourses() {
  const snap = await getDocs(collection(db,"courses"));
  allCourses = [];
  courseListBox.innerHTML = "";
  courseSelect.innerHTML = `<option value="">Select Course</option>`;
  certCourseSelect.innerHTML = `<option value="">Select Course</option>`;

  snap.forEach(d => {
    const c = d.data();
    allCourses.push({ id:d.id, ...c });

    courseListBox.innerHTML += `
      <li>
        <b>${c.courseId}</b> - ${c.name}
        <button onclick="deleteCourse('${d.id}')">Delete</button>
      </li>`;

    courseSelect.innerHTML += `<option value="${c.courseId}">${c.courseId}</option>`;
    certCourseSelect.innerHTML += `<option value="${c.courseId}">${c.courseId}</option>`;
  });
}

window.toggleCourses = () => {
  courseListBox.style.display =
    courseListBox.style.display === "block" ? "none" : "block";
};

window.deleteCourse = async id => {
  if (!confirm("Delete course?")) return;
  await deleteDoc(doc(db,"courses",id));
  loadCourses();
};

/* ================= ASSIGN COURSE ================= */
async function loadStudentsForAssign() {
  if (!studentSelect || !allUsers.length) return;

  studentSelect.innerHTML = `<option value="">Select Student</option>`;
  allUsers.forEach(u => {
    if (u.role === "student") {
      studentSelect.innerHTML += `
        <option value="${u.id}">
          ${u.studentId || u.email}
        </option>`;
    }
  });
}

window.assignCourse = async () => {
  if (!studentSelect.value || !courseSelect.value)
    return alert("Select student and course");

  const ref = doc(db,"users",studentSelect.value);
  const snap = await getDoc(ref);
  const courses = snap.data().courses || [];

  if (!courses.includes(courseSelect.value)) {
    courses.push(courseSelect.value);
    await setDoc(ref,{courses},{merge:true});
    alert("Course assigned");
  }

  studentSelect.value = "";
  courseSelect.value = "";
  loadStudentsForAssign();
};

/* ================= CERTIFICATE MANAGEMENT ================= */
async function loadCertSelectors() {
  if (!certStudentSelect) return;

  certStudentSelect.innerHTML = `<option value="">Select Student</option>`;
  allUsers.forEach(u => {
    if (u.role === "student" && u.studentId) {
      certStudentSelect.innerHTML += `
        <option value="${u.studentId}">
          ${u.studentId}
        </option>`;
    }
  });
}

certStudentSelect.onchange = certCourseSelect.onchange = () => {
  if (certStudentSelect.value && certCourseSelect.value) {
    generatedCertId.innerText =
      `${certStudentSelect.value}-${certCourseSelect.value}`;
  }
};

window.addCertificate = async () => {
  if (!certStudentSelect.value || !certCourseSelect.value || !certLink.value)
    return alert("All fields required");

  const certId = `${certStudentSelect.value}-${certCourseSelect.value}`;
  const ref = doc(db,"certificates",certId);
  if ((await getDoc(ref)).exists()) return alert("Certificate exists");

  let link = certLink.value;
  const m = link.match(/\/d\/([^/]+)/);
  if (m) link = `https://drive.google.com/uc?export=download&id=${m[1]}`;

  await setDoc(ref,{
    studentId: certStudentSelect.value,
    courseId: certCourseSelect.value,
    fileUrl: link
  });

  certLink.value = "";
  generatedCertId.innerText = "---";
  alert("Certificate added");
};

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("userListContainer");
  const search = document.getElementById("studentSearch");

  if (container) container.style.display = "none";
  if (search) search.style.display = "none";
});

