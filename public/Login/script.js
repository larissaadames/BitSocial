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

const bg = document.querySelector('.bg-geo');

window.addEventListener('mousemove', (e) => {

    let x = e.clientX / window.innerWidth;
    let y = e.clientY / window.innerHeight;
    let moveX = (x - 0.5) * -40;
    let moveY = (y - 0.5) * -40;
    bg.style.transform = `translate(${moveX}px, ${moveY}px)`;
});

// Exemplo simplificado para o seu public/Login/script.js
const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        email: inputEmail.value, 
        senha: inputSenha.value 
    })
});