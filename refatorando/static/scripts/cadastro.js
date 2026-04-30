// ─────────────────────────────────────────────────────────────────
//  BitSocial — script.js (Cadastro)
//  MUDANÇA: submission via <form> HTML nativo (POST server-side).
//  Mantidos intactos: máscaras, validação visual e efeito de fundo.
// ─────────────────────────────────────────────────────────────────

// --- Máscara de Telefone ---
const telefone = document.getElementById("telefone");
telefone.addEventListener("input", function (e) {
  let valor = e.target.value.replace(/\D/g, "");
  valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");
  valor = valor.replace(/(\d{5})(\d)/, "$1-$2");
  e.target.value = valor;
});

// --- Data de Nascimento (mínimo 16 anos) ---
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

// --- Máscara de Usuário (prefixo @) ---
const usuarioInput = document.getElementById("usuario");
usuarioInput.addEventListener("input", function () {
  let valor = this.value;
  if (valor.length > 0 && !valor.startsWith("@")) this.value = "@" + valor;
  if (valor.startsWith("@@")) this.value = "@" + valor.replace(/^@+/, "");
});
usuarioInput.addEventListener("focus", function () {
  if (this.value === "") this.value = "@";
});

// --- Toggle de visibilidade da senha ---
function togglePassword(id, btn) {
  const input = document.getElementById(id);
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
}

// --- Efeito parallax do fundo geométrico ---
const bg = document.querySelector(".bg-geo");
window.addEventListener("mousemove", (e) => {
  const moveX = (e.clientX / window.innerWidth - 0.5) * -40;
  const moveY = (e.clientY / window.innerHeight - 0.5) * -40;
  bg.style.transform = `translate(${moveX}px, ${moveY}px)`;
});

// --- Validação visual das regras de senha ---
const senhaInput = document.getElementById("senha");
const regrasValidacao = document.getElementById("regras-validacao");
const rules = {
  len:    document.getElementById("rule-len"),
  upper:  document.getElementById("rule-upper"),
  lower:  document.getElementById("rule-lower"),
  num:    document.getElementById("rule-num"),
  symbol: document.getElementById("rule-symbol"),
};

senhaInput.addEventListener("focus", () => regrasValidacao.classList.add("show"));
senhaInput.addEventListener("blur",  () => regrasValidacao.classList.remove("show"));

senhaInput.addEventListener("input", () => {
  const val = senhaInput.value;
  toggleRule(rules.len,    val.length >= 8);
  toggleRule(rules.upper,  /[A-Z]/.test(val));
  toggleRule(rules.lower,  /[a-z]/.test(val));
  toggleRule(rules.num,    /\d/.test(val));
  toggleRule(rules.symbol, /[@$!%*?&]/.test(val));
});

function toggleRule(el, isValid) {
  el.style.color = isValid ? "#2ecc71" : "#e74c3c";
}

// --- Validação client-side antes do POST ---
//  Confirma as senhas e o formato do telefone.
//  Se válido, o <form> envia normalmente para POST /cadastro (server-side).
const cadastroForm = document.getElementById("form-cadastro");

cadastroForm.addEventListener("submit", function (e) {
  const telValue = document.getElementById("telefone").value;
  const regexTel = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  if (!regexTel.test(telValue)) {
    e.preventDefault();
    alert("Telefone inválido. Use o formato (00) 00000-0000.");
    return;
  }

  const s1 = document.getElementById("senha").value;
  const s2 = document.getElementById("senha-confirmar").value;
  if (s1 !== s2) {
    e.preventDefault();
    alert("As senhas não coincidem!");
    document.getElementById("senha-confirmar").focus();
    return;
  }

  // Validação das regras de complexidade da senha
  const regras = [
    s1.length >= 8,
    /[A-Z]/.test(s1),
    /[a-z]/.test(s1),
    /\d/.test(s1),
    /[@$!%*?&]/.test(s1),
  ];
  if (!regras.every(Boolean)) {
    e.preventDefault();
    alert("A senha não atende todos os requisitos de segurança.");
    document.getElementById("senha").focus();
    return;
  }
});
