import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore, doc, setDoc, getDoc, getDocs,
  deleteDoc, collection, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyAdAEDwbkapoWf5FRWywQ3Lc_yee2fLbck",
  authDomain: "project1-27eeb.firebaseapp.com",
  projectId: "project1-27eeb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* LOGOUT */
window.logoutUser = async () => {
  await signOut(auth);
  location.href = "index.html";
};

/* ADMIN AUTH + LOAD DATA */
let allUsers = [];
let currentView = null;

onAuthStateChanged(auth, async user => {
  if (!user || !location.pathname.includes("admin")) return;

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

  totalStudents.innerText = students;
  totalAdmins.innerText = admins;

  loadCourses();
  loadStudents();
});

/* USER LIST TOGGLE */
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

window.changeUserRole = (id, role) =>
  setDoc(doc(db,"users",id),{role},{merge:true}).then(()=>location.reload());

window.deleteUser = id =>
  confirm("Delete user?") &&
  deleteDoc(doc(db,"users",id)).then(()=>location.reload());

/* COURSES */
async function loadCourses() {
  courseList.innerHTML = "";
  courseSelect.innerHTML = `<option value="">Select Course</option>`;

  const snap = await getDocs(collection(db,"courses"));
  snap.forEach(d => {
    const c = d.data();
    courseList.innerHTML += `
      <li style="margin-bottom:10px">
        <strong>${c.name}</strong><br>
        <small>${c.description}</small><br>
        <button class="btn" onclick="editCourse('${d.id}','${c.name}','${c.description}')">Edit</button>
        <button class="btn danger" onclick="deleteCourse('${d.id}')">Delete</button>
      </li>`;
    courseSelect.innerHTML += `<option value="${d.id}">${c.name}</option>`;
  });
}

window.addCourse = async () => {
  await addDoc(collection(db,"courses"), {
    name: courseName.value,
    description: courseDesc.value
  });
  courseName.value = courseDesc.value = "";
  loadCourses();
};

window.editCourse = async (id, name, desc) => {
  const n = prompt("Edit course name", name);
  const d = prompt("Edit description", desc);
  if (!n || !d) return;
  await setDoc(doc(db,"courses",id),{name:n,description:d},{merge:true});
  loadCourses();
};

window.deleteCourse = async id => {
  if (!confirm("Delete course?")) return;
  await deleteDoc(doc(db,"courses",id));
  loadCourses();
};

/* ASSIGN COURSE */
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
    alert("Select student and course");
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

/* CERTIFICATES */
window.addCertificate = async () => {
  const id = certId.value.trim();
  const email = certEmail.value.trim();
  const course = certCourse.value.trim();
  let link = certLink.value.trim();

  if (!id || !email || !link) {
    alert("Fill all required fields");
    return;
  }

  /* 🔒 CHECK IF CERTIFICATE ID ALREADY EXISTS */
  const existing = await getDoc(doc(db, "certificates", id));
  if (existing.exists()) {
    alert("Certificate ID already exists. Please use a unique ID.");
    return;
  }

  /* CONVERT GOOGLE DRIVE LINK */
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

  alert("Certificate added successfully");
};

