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

const notificationContainer = document.getElementById("notification-container");

function showNotification(message, type = "error") {
  if (!notificationContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  notificationContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// --- Mascara Telefone ---
const telefone = document.getElementById("telefone");
telefone.addEventListener("input", function (e) {
  let valor = e.target.value.replace(/\D/g, "");
  valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");
  valor = valor.replace(/(\d{5})(\d)/, "$1-$2");
  e.target.value = valor;
});

// --- Data de Nascimento (Minimo 16 anos) ---
const dataNascimentoInput = document.getElementById("dt-nasc");
const hoje = new Date();
const dataMinima16 = new Date();
dataMinima16.setFullYear(hoje.getFullYear() - 16);

const formatarData = (data) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};
dataNascimentoInput.max = formatarData(dataMinima16);

// --- Mascara Usuario ---
const usuarioInput = document.getElementById("usuario");
usuarioInput.addEventListener("input", function () {
  let valor = this.value;
  if (valor.length > 0 && !valor.startsWith("@")) this.value = "@" + valor;
  if (valor.startsWith("@@")) this.value = "@" + valor.replace(/^@+/, "");
});

usuarioInput.addEventListener("focus", function () {
  if (this.value === "") this.value = "@";
});

// --- Toggle Password ---
function togglePassword(id, btn) {
  const input = document.getElementById(id);
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
}

// --- Efeito Background ---
const bg = document.querySelector(".bg-geo");
window.addEventListener("mousemove", (e) => {
  const moveX = (e.clientX / window.innerWidth - 0.5) * -40;
  const moveY = (e.clientY / window.innerHeight - 0.5) * -40;
  bg.style.transform = `translate(${moveX}px, ${moveY}px)`;
});

// --- Validacao Visual da Senha ---
const senhaInput = document.getElementById("senha");
const regrasValidacao = document.getElementById("regras-validacao");
const rules = {
  len: document.getElementById("rule-len"),
  upper: document.getElementById("rule-upper"),
  lower: document.getElementById("rule-lower"),
  num: document.getElementById("rule-num"),
  symbol: document.getElementById("rule-symbol"),
};

senhaInput.addEventListener("focus", () => regrasValidacao.classList.add("show"));
senhaInput.addEventListener("blur", () => regrasValidacao.classList.remove("show"));

senhaInput.addEventListener("input", () => {
  const val = senhaInput.value;
  toggleRule(rules.len, val.length >= 8);
  toggleRule(rules.upper, /[A-Z]/.test(val));
  toggleRule(rules.lower, /[a-z]/.test(val));
  toggleRule(rules.num, /\d/.test(val));
  toggleRule(rules.symbol, /[@$!%*?&]/.test(val));
});

function toggleRule(el, isValid) {
  el.style.color = isValid ? "#2ecc71" : "#e74c3c";
}

function getCampoLabel(campo) {
  if (!campo || !campo.id) return "campo";
  const label = document.querySelector(`label[for="${campo.id}"]`);
  return label ? label.textContent.trim().toLowerCase() : "campo";
}

function getMensagemCampoInvalido(campo) {
  if (!campo || !campo.validity) {
    return "Verifique os campos obrigatorios.";
  }

  const nomeCampo = getCampoLabel(campo);

  if (campo.validity.valueMissing) {
    return `Preencha o campo ${nomeCampo}.`;
  }
  if (campo.validity.typeMismatch) {
    return `Informe um ${nomeCampo} valido.`;
  }
  if (campo.validity.patternMismatch) {
    return campo.title || `Formato invalido para ${nomeCampo}.`;
  }
  if (campo.validity.tooShort) {
    return `${nomeCampo.charAt(0).toUpperCase() + nomeCampo.slice(1)} muito curto.`;
  }

  return campo.title || "Verifique os dados informados.";
}

// --- Submissao do formulario ---
const cadastroForm = document.getElementById("form-cadastro");

cadastroForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const primeiroCampoInvalido = Array.from(cadastroForm.elements).find((campo) => {
    return typeof campo.checkValidity === "function" && !campo.checkValidity();
  });

  if (primeiroCampoInvalido) {
    primeiroCampoInvalido.focus();
    primeiroCampoInvalido.classList.add("input-invalid");
    setTimeout(() => primeiroCampoInvalido.classList.remove("input-invalid"), 1200);
    showNotification(getMensagemCampoInvalido(primeiroCampoInvalido), "error");
    return;
  }

  const telValue = document.getElementById("telefone").value;
  const regexTel = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  if (!regexTel.test(telValue)) {
    showNotification("Telefone invalido", "error");
    return;
  }

  const s1 = document.getElementById("senha").value;
  const s2 = document.getElementById("senha-confirmar").value;

  if (s1 !== s2) {
    showNotification("As senhas nao coincidem!", "error");
    document.getElementById("senha-confirmar").focus();
    return;
  }

  const dados = {
    username: document.getElementById("usuario").value,
    dtNasc: document.getElementById("dt-nasc").value,
    email: document.getElementById("email").value,
    senha: s1,
    nome: document.getElementById("nome").value,
    sobrenome: document.getElementById("sobrenome").value,
    telefone: telValue,
  };

  try {
    const response = await fetch(`${APP_BASE_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    const data = await lerResposta(response);

    if (response.ok) {
      showNotification("Usuario cadastrado com sucesso!", "success");
      setTimeout(() => {
        window.location.href = `${APP_BASE_URL}/public/Login/login.html`;
      }, 900);
    } else {
      console.error("Erro de validacao:", data.detail);
      showNotification("Erro no cadastro: " + (data.detail || "Verifique os campos."), "error");
    }
  } catch (error) {
    console.error("Erro ao conectar com a API:", error);
    showNotification("Erro de conexao com o servidor.", "error");
  }
});
