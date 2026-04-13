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


// NÃO MEXER NA PARTE DO BANCO DE DADOS PQ FINALMENTE TA FUNCIONANDO

const cadastroForm = document.querySelector("form");

cadastroForm.addEventListener("submit", async function (e) {
  e.preventDefault(); // Impede o recarregamento da página

  // Captura os valores garantindo que os IDs existam no seu HTML
// Dentro do cadastroForm.addEventListener("submit", ...)
const dados = {
    username: document.getElementById("usuario")?.value || "",
    dtNasc: document.getElementById("dt-nasc")?.value || "",
    email: document.querySelector('input[type="email"]')?.value || "",
    senha: document.getElementById("senha-cad")?.value || document.getElementById("senha")?.value, 
    nome: document.getElementById("nome")?.value || "",
    sobrenome: document.getElementById("sobrenome")?.value || "",
    telefone: document.getElementById("telefone")?.value || ""
};

  try {
    const response = await fetch('/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });

    const data = await response.json();

    if (response.ok) {
      alert("Usuário cadastrado com sucesso!");
      window.location.href = "/public/Login/login.html"; // Redireciona após sucesso
    } else {
      // Exibe detalhes do erro 422 para ajudar no debug
      console.error("Erro de validação:", data.detail);
      alert("Erro no cadastro. Verifique o console para detalhes.");
    }
  } catch (error) {
    console.error("Erro ao conectar com a API:", error);
  }
});