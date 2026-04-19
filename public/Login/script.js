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

async function lerResposta(response) {
  const texto = await response.text();

  try {
    return texto ? JSON.parse(texto) : {};
  } catch {
    return { detail: texto || "Erro inesperado no servidor." };
  }
}

function togglePassword() {
  const input = document.getElementById("password");

  if (input.type === "password") {
    input.type = "text";
    input.style.fontFamily = '"Orbitron", sans-serif';
  } else {
    input.type = "password";
    input.style.fontFamily = '"Segoe UI", sans-serif';
  }
}

// Animação do fundo geométrico
const bg = document.querySelector(".bg-geo");
if (bg) {
    window.addEventListener("mousemove", (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      const moveX = (x - 0.5) * -40;
      const moveY = (y - 0.5) * -40;
      bg.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
}

const loginForm = document.querySelector("form");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.querySelector('input[type="email"]').value;
  const senha = document.querySelector('input[type="password"]').value;

  try {
    const response = await fetch(`${APP_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, senha: senha }),
    });

    const data = await lerResposta(response);

    if (response.ok) {
        // --- MUDANÇAS AQUI: Persistindo a sessão para o Perfil e Home ---
        
      // Mantemos o token para ações autenticadas no feed.
      const accessToken = data.access_token || data.token;
      if (accessToken) localStorage.setItem("token", accessToken);
        
        // Salvamos o ID e Username (essenciais para as rotas que criamos no main.py)
        localStorage.setItem("userId", data.id);
        localStorage.setItem("username", data.username);
        
        // Redirecionamento original mantido
        window.location.href = `${APP_BASE_URL}/public/perfil/perfil.html`;
        
    } else {
      alert("Falha no login: " + (data.detail || "E-mail ou senha incorretos."));
    }
  } catch (error) {
    console.error("Erro ao conectar com a API:", error);
    alert("Erro no servidor. Verifique se o Uvicorn esta rodando.");
  }
});

// const token = localStorage.getItem("token");

// if (!token) {
//   window.location.href = `${APP_BASE_URL}/public/Login/login.html`;
// }
