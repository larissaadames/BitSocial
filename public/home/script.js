// Coloca isso no início de cada página protegida
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/public/home/index.html";
}