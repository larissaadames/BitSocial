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


// Seleciona o formulário de login
const loginForm = document.querySelector('form');

loginForm.addEventListener('submit', async (event) => {
    // Impede o envio padrão do HTML que recarrega a página
    event.preventDefault();

    // Captura os valores dos inputs (certifique-se de que os IDs coincidem com seu HTML)
    const email = document.querySelector('input[type="email"]').value;
    const senha = document.querySelector('input[type="password"]').value;

    try {
        // Envia os dados para a rota /login que criamos no main.py
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, senha: senha })
        });

        const data = await response.json();

        if (response.ok) {
            // Se o status for 200 (Sucesso), redireciona o usuário
            console.log("Login bem-sucedido para:", data.username);
            
            // Altere para o caminho da página que você deseja abrir após o login
            window.location.href = "/public/perfil/perfil.html"; 
        } else {
            // Se o backend retornou erro (ex: 401), exibe a mensagem de erro
            alert("Falha no login: " + (data.detail || "E-mail ou senha incorretos."));
        }
    } catch (error) {
        console.error("Erro ao conectar com a API:", error);
        alert("Erro no servidor. Verifique se o Uvicorn está rodando.");
    }
});