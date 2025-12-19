import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore, doc, setDoc, getDoc, getDocs,
  deleteDoc, collection, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

/* ---------------- COURSES ---------------- */

window.addCourse = async () => {
  if (!courseId.value || !courseName.value) {
    alert("Course ID and Name required");
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
  courseList.innerHTML = "";
  const snap = await getDocs(collection(db, "courses"));

  snap.forEach(d => {
    const c = d.data();
    courseList.innerHTML += `
      <li>
        <strong>${c.courseId}</strong> - ${c.name}<br>
        <small>${c.description}</small>
        <button onclick="deleteCourse('${d.id}')">Delete</button>
      </li>`;
  });

  loadCertCourses();
}

window.deleteCourse = async id => {
  if (!confirm("Delete course?")) return;
  await deleteDoc(doc(db, "courses", id));
  loadCourses();
};

/* ---------------- CERTIFICATE DATA ---------------- */

let students = [];
let courses = [];

async function loadCertStudents() {
  students = [];
  const snap = await getDocs(collection(db, "users"));
  snap.forEach(d => {
    if (d.data().studentId) students.push(d.data().studentId);
  });
  renderStudents(students);
}

async function loadCertCourses() {
  courses = [];
  const snap = await getDocs(collection(db, "courses"));
  snap.forEach(d => courses.push(d.data().courseId));
  renderCourses(courses);
}

function renderStudents(list) {
  studentSelect.innerHTML = "";
  list.forEach(id => studentSelect.innerHTML += `<option>${id}</option>`);
}

function renderCourses(list) {
  courseSelect.innerHTML = "";
  list.forEach(id => courseSelect.innerHTML += `<option>${id}</option>`);
}

window.filterStudents = txt =>
  renderStudents(students.filter(s => s.includes(txt)));

window.filterCourses = txt =>
  renderCourses(courses.filter(c => c.includes(txt)));

studentSelect.onchange = courseSelect.onchange = () => {
  if (studentSelect.value && courseSelect.value) {
    generatedCertId.innerText =
      `${studentSelect.value}-${courseSelect.value}`;
  }
};

/* ---------------- CERTIFICATE ---------------- */

window.addCertificate = async () => {
  if (!studentSelect.value || !courseSelect.value || !certLink.value) {
    alert("Select student, course and add link");
    return;
  }

  const certId = `${studentSelect.value}-${courseSelect.value}`;
  const exists = await getDoc(doc(db, "certificates", certId));
  if (exists.exists()) {
    alert("Certificate already exists");
    return;
  }

  let link = certLink.value;
  const match = link.match(/\/d\/([^/]+)/);
  if (match) {
    link = `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }

  await setDoc(doc(db, "certificates", certId), {
    studentId: studentSelect.value,
    courseId: courseSelect.value,
    fileUrl: link
  });

  certLink.value = "";
  generatedCertId.innerText = "---";
  alert("Certificate added");
};

/* INIT */
onAuthStateChanged(auth, user => {
  if (!user) return;
  loadCourses();
  loadCertStudents();
});
