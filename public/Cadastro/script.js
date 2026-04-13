// mascara telefone

const telefone = document.getElementById("telefone");

telefone.addEventListener("input", function (e) {
  let valor = e.target.value;

  valor = valor.replace(/\D/g, "");

  valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");
  valor = valor.replace(/(\d{5})(\d)/, "$1-$2");

  e.target.value = valor;
});

const form = document.querySelector("form");

form.addEventListener("submit", function (e) {
  const telefone = document.getElementById("telefone").value;

  const regex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;

  if (!regex.test(telefone)) {
    alert("Telefone inválido");
    e.preventDefault();
  }
});

//

// data de nascimento

const dataNascimentoInput = document.getElementById('dt-nasc');

const hoje = new Date();

const dataMinima16 = new Date();
dataMinima16.setFullYear(hoje.getFullYear() - 16);

const formatarData = (data) => {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
};

dataNascimentoInput.max = formatarData(dataMinima16);

const usuarioInput = document.getElementById('usuario');

// 

// mascara "@" usuario

usuarioInput.addEventListener('input', function() {
    let valor = this.value;

    if (valor.length > 0 && !valor.startsWith('@')) {
        this.value = '@' + valor;
    }

    if (valor.startsWith('@@')) {
        this.value = '@' + valor.replace(/^@+/, '');
    }
});

usuarioInput.addEventListener('focus', function() {
    if (this.value === '') {
        this.value = '@';
    }
});

usuarioInput.addEventListener('blur', function() {
    if (this.value === '@') {
        this.value = '';
    }
});

function togglePassword(id, btn) {
    const input = document.getElementById(id);

    if (input.type === "password") {
        input.type = "text";
        input.style.fontFamily = '"Orbitron", sans-serif';
        btn.textContent = "👁";
    } else {
        input.type = "password";
        input.style.fontFamily = '"Segoe UI", sans-serif';
        btn.textContent = "👁";
    }
}

const bg = document.querySelector('.bg-geo');

window.addEventListener('mousemove', (e) => {

    let x = e.clientX / window.innerWidth;
    let y = e.clientY / window.innerHeight;
    let moveX = (x - 0.5) * -40;
    let moveY = (y - 0.5) * -40;
    bg.style.transform = `translate(${moveX}px, ${moveY}px)`;
});

const senha = document.getElementById("senha");

const rules = {
  len: document.getElementById("rule-len"),
  upper: document.getElementById("rule-upper"),
  lower: document.getElementById("rule-lower"),
  num: document.getElementById("rule-num"),
  symbol: document.getElementById("rule-symbol"),
};

senha.addEventListener("input", () => {
  const value = senha.value;

  toggle(rules.len, value.length >= 8);
  toggle(rules.upper, /[A-Z]/.test(value));
  toggle(rules.lower, /[a-z]/.test(value));
  toggle(rules.num, /\d/.test(value));
  toggle(rules.symbol, /[@$!%*?&]/.test(value));
});

function toggle(element, isValid) {
  if (isValid) {
    element.style.color = "green";
  } else {
    element.style.color = "red";
  }
}