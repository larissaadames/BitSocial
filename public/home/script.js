const APP_BASE_URL = (() => {
  const { protocol, hostname, port, origin } = window.location;
  const isLocalhost = hostname === "127.0.0.1" || hostname === "localhost";

  if (protocol === "file:") {
    return "http://127.0.0.1:8000";
  }

  if (isLocalhost && port !== "8000") {
    return "http://127.0.0.1:8000";
  }

  return origin;
})();

const searchInput = document.getElementById("search-bar");
const resultsBox = document.getElementById("search-results");

function limparResultados() {
  resultsBox.innerHTML = "";
  resultsBox.classList.remove("show");
}

function renderizarResultados(usuarios) {
  if (usuarios.length === 0) {
    resultsBox.innerHTML = '<div class="search-empty">Nenhum usuario encontrado.</div>';
    resultsBox.classList.add("show");
    return;
  }

  resultsBox.innerHTML = usuarios
    .map(
      (usuario) => `
        <div class="search-item">
          <strong>${usuario.username}</strong><br>
          <span>${usuario.nome} ${usuario.sobrenome}</span>
        </div>
      `,
    )
    .join("");

  resultsBox.classList.add("show");
}

searchInput.addEventListener("input", async () => {
  const termo = searchInput.value.trim();

  if (termo.length < 2) {
    limparResultados();
    return;
  }

  try {
    const response = await fetch(
      `${APP_BASE_URL}/usuarios/busca?username=${encodeURIComponent(termo)}`,
    );

    if (!response.ok) {
      throw new Error("Falha ao buscar usuarios");
    }

    const usuarios = await response.json();
    renderizarResultados(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuarios:", error);
    resultsBox.innerHTML = '<div class="search-empty">Erro ao buscar usuarios.</div>';
    resultsBox.classList.add("show");
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-section")) {
    limparResultados();
  }
});
