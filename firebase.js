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

/* ================= LOGOUT ================= */
window.logoutUser = async () => {
  await signOut(auth);
  location.href = "login.html";
};

/* ================= GLOBAL ================= */
let allUsers = [];
let allCourses = [];

/* ================= AUTH ROUTER ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (location.pathname.includes("admin") || location.pathname.includes("student")) {
      location.href = "login.html";
    }
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) {
    location.href = "login.html";
    return;
  }

  const role = snap.data().role;

  if (location.pathname.includes("login")) {
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
    loadStudentsForAssign();
    loadCertSelectors();
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
  renderUsers(allUsers);
}

function renderUsers(users) {
  userTable.innerHTML = "";
  users.forEach(u => {
    userTable.innerHTML += `
      <tr>
        <td>${u.studentId || "-"}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>
          <select onchange="changeUserRole('${u.id}',this.value)">
            <option value="student" ${u.role==="student"?"selected":""}>Student</option>
            <option value="admin" ${u.role==="admin"?"selected":""}>Admin</option>
          </select>
        </td>
        <td>
          <button class="btn" onclick="viewStudent('${u.studentId || ""}')">View</button>
        </td>
        <td>
          <button class="btn danger" onclick="deleteUser('${u.id}')">Delete</button>
        </td>
      </tr>`;
  });
}

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
  await setDoc(doc(db, "users", id), { role }, { merge: true });
  loadUsers();
};

window.deleteUser = async id => {
  if (!confirm("Delete user?")) return;
  await deleteDoc(doc(db, "users", id));
  loadUsers();
};

/* ================= STUDENT ID GENERATOR ================= */
window.assignStudentIds = async () => {
  const prefix = idPrefix.value.trim();
  let start = parseInt(idStart.value, 10);

  if (!prefix || isNaN(start)) {
    alert("Enter valid prefix and start number");
    return;
  }

  for (const u of allUsers) {
    if (u.role === "student" && !u.studentId) {
      const sid = `${prefix}-${String(start).padStart(3, "0")}`;
      await setDoc(doc(db, "users", u.id), { studentId: sid }, { merge: true });
      start++;
    }
  }

  alert("Student IDs assigned");
  loadUsers();
};

/* ================= STUDENT POPUP ================= */
window.viewStudent = studentId => {
  if (!studentId) {
    alert("Student ID not assigned");
    return;
  }

  const student = allUsers.find(u => u.studentId === studentId);
  if (!student) return;

  studentDashboardContent.innerHTML = `
    <h2>Student Dashboard</h2>
    <p><strong>ID:</strong> ${student.studentId}</p>
    <p><strong>Email:</strong> ${student.email}</p>
    <h3>Courses</h3>
    <ul>${(student.courses || []).map(c => `<li>${c}</li>`).join("")}</ul>
  `;

  studentOverlay.style.display = "block";
};

window.closeStudentView = () => {
  studentOverlay.style.display = "none";
};

/* ================= COURSE MANAGEMENT ================= */
window.addCourse = async () => {
  if (!courseId.value || !courseName.value) {
    alert("Course ID & name required");
    return;
  }

  await addDoc(collection(db, "courses"), {
    courseId: courseId.value.toUpperCase(),
    name: courseName.value,
    description: courseDesc.value
  });

  courseId.value = courseName.value = courseDesc.value = "";
  loadCourses();
};

async function loadCourses() {
  const snap = await getDocs(collection(db, "courses"));
  allCourses = [];
  courseListBox.innerHTML = "";
  courseSelect.innerHTML = `<option value="">Select Course</option>`;
  certCourseSelect.innerHTML = `<option value="">Select Course</option>`;

  snap.forEach(d => {
    const c = d.data();
    allCourses.push({ id: d.id, ...c });

    courseListBox.innerHTML += `
      <li>
        <strong>${c.courseId}</strong> - ${c.name}<br>
        <small>${c.description}</small><br>
        <button class="btn" onclick="editCourse('${d.id}','${c.courseId}','${c.name}','${c.description}')">Edit</button>
        <button class="btn danger" onclick="deleteCourse('${d.id}')">Delete</button>
      </li>`;

    courseSelect.innerHTML += `<option value="${c.courseId}">${c.courseId}</option>`;
    certCourseSelect.innerHTML += `<option value="${c.courseId}">${c.courseId}</option>`;
  });
}

window.toggleCourses = () => {
  courseListBox.style.display =
    courseListBox.style.display === "block" ? "none" : "block";
};

window.editCourse = async (id, cid, name, desc) => {
  const nCid = prompt("Course ID", cid);
  const nName = prompt("Course Name", name);
  const nDesc = prompt("Description", desc);
  if (!nCid || !nName) return;

  await setDoc(doc(db, "courses", id), {
    courseId: nCid.toUpperCase(),
    name: nName,
    description: nDesc
  }, { merge: true });

  loadCourses();
};

window.deleteCourse = async id => {
  if (!confirm("Delete course?")) return;
  await deleteDoc(doc(db, "courses", id));
  loadCourses();
};

/* ================= ASSIGN COURSE ================= */
async function loadStudentsForAssign() {
  studentSelect.innerHTML = `<option value="">Select Student</option>`;
  allUsers.forEach(u => {
    if (u.role === "student") {
      studentSelect.innerHTML += `<option value="${u.id}">${u.studentId || u.email}</option>`;
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

  studentSelect.value = "";
  courseSelect.value = "";
};

/* ================= CERTIFICATE MANAGEMENT ================= */
async function loadCertSelectors() {
  certStudentSelect.innerHTML = `<option value="">Select Student</option>`;
  allUsers.forEach(u => {
    if (u.role === "student" && u.studentId) {
      certStudentSelect.innerHTML += `<option value="${u.studentId}">${u.studentId}</option>`;
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
  if (!certStudentSelect.value || !certCourseSelect.value || !certLink.value) {
    alert("All fields required");
    return;
  }

  const certId = `${certStudentSelect.value}-${certCourseSelect.value}`;
  const exists = await getDoc(doc(db, "certificates", certId));
  if (exists.exists()) {
    alert("Certificate already exists");
    return;
  }

  let link = certLink.value;
  const m = link.match(/\/d\/([^/]+)/);
  if (m) {
    link = `https://drive.google.com/uc?export=download&id=${m[1]}`;
  }

  await setDoc(doc(db, "certificates", certId), {
    studentId: certStudentSelect.value,
    courseId: certCourseSelect.value,
    fileUrl: link
  });

  certLink.value = "";
  generatedCertId.innerText = "---";
  alert("Certificate added");
};
