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

const bg = document.querySelector(".bg-geo");

window.addEventListener("mousemove", (e) => {
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;
  const moveX = (x - 0.5) * -40;
  const moveY = (y - 0.5) * -40;
  bg.style.transform = `translate(${moveX}px, ${moveY}px)`;
});

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
      console.log("Login bem-sucedido para:", data.username);
      window.location.href = `${APP_BASE_URL}/public/perfil/perfil.html`;
    } else {
      alert("Falha no login: " + (data.detail || "E-mail ou senha incorretos."));
    }
  } catch (error) {
    console.error("Erro ao conectar com a API:", error);
    alert("Erro no servidor. Verifique se o Uvicorn esta rodando.");
  }
});


