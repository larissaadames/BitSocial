// --- Máscara Telefone ---
const telefone = document.getElementById("telefone");
telefone.addEventListener("input", function (e) {
  let valor = e.target.value.replace(/\D/g, "");
  valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");
  valor = valor.replace(/(\d{5})(\d)/, "$1-$2");
  e.target.value = valor;
});

// --- Data de Nascimento (Mínimo 16 anos) ---
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

// --- Máscara Usuário ---
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
  input.style.fontFamily = isPassword ? '"Orbitron", sans-serif' : '"Segoe UI", sans-serif';
}

// --- Efeito Background ---
const bg = document.querySelector(".bg-geo");
window.addEventListener("mousemove", (e) => {
  let moveX = (e.clientX / window.innerWidth - 0.5) * -40;
  let moveY = (e.clientY / window.innerHeight - 0.5) * -40;
  bg.style.transform = `translate(${moveX}px, ${moveY}px)`;
});

// --- Validação Visual da Senha ---
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

// --- SUBMISSÃO DO FORMULÁRIO (COM BANCO DE DADOS) ---
const cadastroForm = document.getElementById("form-cadastro");

cadastroForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  // 1. Validação de Telefone (Regex)
  const telValue = document.getElementById("telefone").value;
  const regexTel = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  if (!regexTel.test(telValue)) {
    alert("Telefone inválido");
    return;
  }

  // 2. Validação de Igualdade de Senhas
  const s1 = document.getElementById("senha").value;
  const s2 = document.getElementById("senha-confirmar").value;

  if (s1 !== s2) {
    alert("As senhas não coincidem!");
    document.getElementById("senha-confirmar").focus();
    return;
  }

  // 3. Preparação dos Dados
  const dados = {
    username: document.getElementById("usuario").value,
    dtNasc: document.getElementById("dt-nasc").value,
    email: document.getElementById("email").value,
    senha: s1,
    nome: document.getElementById("nome").value,
    sobrenome: document.getElementById("sobrenome").value,
    telefone: telValue,
  };

  // 4. Envio para a API
  try {
    const response = await fetch("/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Usuário cadastrado com sucesso!");
      window.location.href = "/public/Login/login.html";
    } else {
      console.error("Erro de validação:", data.detail);
      alert("Erro no cadastro. Verifique os campos.");
    }
  } catch (error) {
    console.error("Erro ao conectar com a API:", error);
    alert("Erro de conexão com o servidor.");
  }
});