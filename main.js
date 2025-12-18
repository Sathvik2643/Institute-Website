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

/* ================= ADMIN ACCORDION (FIXED) ================= */
window.toggleAccordion = function (index) {
  const sections = document.querySelectorAll(".accordion-content");

  sections.forEach((sec, i) => {
    if (i === index) {
      sec.style.display =
        sec.style.display === "block" ? "none" : "block";
    } else {
      sec.style.display = "none";
    }
  });
};

/* ===== TOGGLE COURSES LIST ===== */
window.toggleCourses = function () {
  const box = document.getElementById("courseListBox");
  box.style.display = box.style.display === "block" ? "none" : "block";
};
