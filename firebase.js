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

    // 🔑 Redirect decision handled by onAuthStateChanged
    // Just wait for auth state
  } catch (err) {
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
  location.href = "login.html";
};

/* ================= GLOBAL STATE ================= */
let allUsers = [];

/* ================= AUTH ROUTER (SINGLE SOURCE OF TRUTH) ================= */
onAuthStateChanged(auth, async (user) => {

  /* NOT LOGGED IN */
  if (!user) {
    if (
      location.pathname.includes("admin") ||
      location.pathname.includes("student")
    ) {
      location.href = "login.html";
    }
    return;
  }

  /* FETCH USER ROLE */
  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) {
    location.href = "login.html";
    return;
  }

  const role = snap.data().role;

  /* LOGIN PAGE → DASHBOARD */
  if (location.pathname.includes("login")) {
    location.href = role === "admin" ? "admin.html" : "student.html";
    return;
  }

  /* ADMIN PAGE PROTECTION */
  if (location.pathname.includes("admin") && role !== "admin") {
    location.href = "student.html";
    return;
  }

  /* STUDENT PAGE PROTECTION */
  if (location.pathname.includes("student") && role !== "student") {
    location.href = "admin.html";
    return;
  }

  /* ================= ADMIN PAGE INIT ================= */
  if (location.pathname.includes("admin")) {

    const usersSnap = await getDocs(collection(db, "users"));
    allUsers = [];

    let students = 0;
    let admins = 0;

    usersSnap.forEach(d => {
      const u = d.data();
      allUsers.push({ id: d.id, ...u });
      if (u.role === "student") students++;
      if (u.role === "admin") admins++;
    });

    totalStudents.innerText = students;
    totalAdmins.innerText = admins;

    loadCourses();
    loadStudents();
    loadCertStudents();
  }
});

/* ================= USER MANAGEMENT ================= */
window.toggleUserList = role => {
  const box = document.getElementById("userListContainer");
  const search = document.getElementById("studentSearch");

  box.style.display = "block";
  search.style.display = role === "student" ? "block" : "none";

  renderUsers(allUsers.filter(u => u.role === role));
};

window.searchStudents = txt => {
  renderUsers(
    allUsers.filter(
      u => u.role === "student" &&
      u.email.toLowerCase().includes(txt.toLowerCase())
    )
  );
};

function renderUsers(users) {
  userTable.innerHTML = "";
  users.forEach(u => {
    userTable.innerHTML += `
      <tr>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>
          <select onchange="changeUserRole('${u.id}',this.value)">
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
  await setDoc(doc(db,"users",id),{role},{merge:true});
  location.reload();
};

window.deleteUser = async id => {
  if (!confirm("Delete user?")) return;
  await deleteDoc(doc(db,"users",id));
  location.reload();
};

/* ================= COURSES ================= */
window.addCourse = async () => {
  if (!courseId.value || !courseName.value) {
    alert("Course ID & Name required");
    return;
  }

  await addDoc(collection(db,"courses"),{
    courseId: courseId.value.toUpperCase(),
    name: courseName.value,
    description: courseDesc.value
  });

  courseId.value = courseName.value = courseDesc.value = "";
  loadCourses();
};

window.editCourse = async (docId, cid, name, desc) => {
  const nCid = prompt("Edit Course ID", cid);
  const nName = prompt("Edit Course Name", name);
  const nDesc = prompt("Edit Description", desc);
  if (!nCid || !nName) return;

  await setDoc(doc(db,"courses",docId),{
    courseId: nCid.toUpperCase(),
    name: nName,
    description: nDesc
  },{merge:true});

  loadCourses();
};

async function loadCourses() {
  courseList.innerHTML = "";
  courseSelect.innerHTML = `<option value="">Select Course</option>`;

  const snap = await getDocs(collection(db,"courses"));
  snap.forEach(d => {
    const c = d.data();
    courseList.innerHTML += `
      <li>
        <strong>${c.courseId}</strong> - ${c.name}<br>
        <small>${c.description}</small><br>
        <button class="btn" onclick="editCourse('${d.id}','${c.courseId}','${c.name}','${c.description}')">Edit</button>
        <button class="btn danger" onclick="deleteCourse('${d.id}')">Delete</button>
      </li>`;
    courseSelect.innerHTML += `<option value="${c.courseId}">${c.courseId}</option>`;
  });

  loadCertCourses();
}

window.deleteCourse = async id => {
  if (!confirm("Delete course?")) return;
  await deleteDoc(doc(db,"courses",id));
  loadCourses();
};

/* ================= ASSIGN COURSE ================= */
async function loadStudents() {
  studentSelect.innerHTML = `<option value="">Select Student</option>`;
  const snap = await getDocs(collection(db,"users"));
  snap.forEach(d => {
    if (d.data().role === "student") {
      studentSelect.innerHTML += `<option value="${d.id}">${d.data().email}</option>`;
    }
  });
}

window.assignCourse = async () => {
  if (!studentSelect.value || !courseSelect.value) {
    alert("Select student & course");
    return;
  }

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
};

/* ================= CERTIFICATES ================= */
let certStudents = [];
let certCourses = [];

async function loadCertStudents() {
  certStudents = [];
  const snap = await getDocs(collection(db,"users"));
  snap.forEach(d => {
    if (d.data().studentId) certStudents.push(d.data().studentId);
  });
  renderCertStudents(certStudents);
}

async function loadCertCourses() {
  certCourses = [];
  const snap = await getDocs(collection(db,"courses"));
  snap.forEach(d => certCourses.push(d.data().courseId));
  renderCertCourses(certCourses);
}

function renderCertStudents(list) {
  certStudentSelect.innerHTML = "";
  list.forEach(id => certStudentSelect.innerHTML += `<option>${id}</option>`);
}

function renderCertCourses(list) {
  certCourseSelect.innerHTML = "";
  list.forEach(id => certCourseSelect.innerHTML += `<option>${id}</option>`);
}

window.filterStudents = txt =>
  renderCertStudents(certStudents.filter(s => s.includes(txt)));

window.filterCourses = txt =>
  renderCertCourses(certCourses.filter(c => c.includes(txt)));

certStudentSelect.onchange = certCourseSelect.onchange = () => {
  if (certStudentSelect.value && certCourseSelect.value) {
    generatedCertId.innerText =
      `${certStudentSelect.value}-${certCourseSelect.value}`;
  }
};

window.addCertificate = async () => {
  if (!certStudentSelect.value || !certCourseSelect.value || !certLink.value) {
    alert("Select student, course and add link");
    return;
  }

  const certId = `${certStudentSelect.value}-${certCourseSelect.value}`;
  const exists = await getDoc(doc(db,"certificates",certId));
  if (exists.exists()) {
    alert("Certificate already exists");
    return;
  }

  let link = certLink.value;
  const m = link.match(/\/d\/([^/]+)/);
  if (m) link = `https://drive.google.com/uc?export=download&id=${m[1]}`;

  await setDoc(doc(db,"certificates",certId),{
    studentId: certStudentSelect.value,
    courseId: certCourseSelect.value,
    fileUrl: link
  });

  certLink.value = "";
  generatedCertId.innerText = "---";
  alert("Certificate added");
};
