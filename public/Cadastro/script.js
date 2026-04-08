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
