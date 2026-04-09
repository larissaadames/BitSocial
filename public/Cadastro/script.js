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


