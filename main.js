/* ================= SECTION NAVIGATION ================= */
window.showSection = function (id) {
  document.querySelectorAll(".section").forEach(s => {
    s.style.display = "none";
  });
  const el = document.getElementById(id);
  if (el) el.style.display = "block";
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("home")) {
    showSection("home");
  }
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
});

/* ================= MOBILE MENU ================= */
window.toggleMenu = function () {
  document.getElementById("navMenu")?.classList.toggle("show");
};

window.closeMenu = function () {
  document.getElementById("navMenu")?.classList.remove("show");
};

/* ================= THEME ================= */
window.toggleTheme = function () {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
};

/* ================= ADMIN ACCORDION ================= */
window.toggleAccordion = function (index) {
  document.querySelectorAll(".accordion-content").forEach((el, i) => {
    el.style.display =
      i === index && el.style.display !== "block" ? "block" : "none";
  });
};

/* ================= COURSES LIST TOGGLE ================= */
window.toggleCourses = function () {
  const box = document.getElementById("courseListBox");
  box.style.display = box.style.display === "block" ? "none" : "block";
};
