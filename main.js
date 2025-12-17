let certificates = [];

fetch("certificates.json")
  .then(r => r.json())
  .then(d => certificates = d);

function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
}

function toggleMenu() {
  const menu = document.getElementById("navMenu");
  menu.classList.toggle("show");
}

function verifyCert() {
  const id = document.getElementById("certInput").value.trim().toUpperCase();
  const res = document.getElementById("certResult");
  const down = document.getElementById("certDownload");
  down.innerHTML = "";

  const found = certificates.find(c => c.id === id);
  if (found) {
    res.textContent = "✔ VALID Certificate";
    res.style.color = "green";
    const a = document.createElement("a");
    a.href = found.file;
    a.target = "_blank";
    a.className = "btn";
    a.textContent = "Download Certificate";
    down.appendChild(a);
  } else {
    res.textContent = "✖ INVALID Certificate";
    res.style.color = "red";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  showSection("home");
});
