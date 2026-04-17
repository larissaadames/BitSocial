// Lógica de URL dinâmica (Igual ao Login)
const APP_BASE_URL = (() => {
  const { protocol, hostname, port, origin } = window.location;
  const isLocalhost = hostname === "127.0.0.1" || hostname === "localhost";
  if (protocol === "file:") return "http://127.0.0.1:8000";
  if (isLocalhost && port !== "8000") return "http://127.0.0.1:8000";
  return origin;
})();

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const targetUserId = params.get('id'); 
    const loggedUserId = localStorage.getItem('userId');

    const userIdToFetch = targetUserId || loggedUserId;

    if (!userIdToFetch) {
        window.location.href = "../Login/login.html";
        return;
    }

    const btnEditar = document.querySelector('#btn-edit-perfil');
    const btnSalvar = document.querySelector('#btn-save-perfil');
    const displayNome = document.querySelector('#display-nome-completo');
    const displayUsername = document.querySelector('#display-username');
    const displayBio = document.querySelector('#display-bio');

    // CARREGAR PERFIL (Read)
    async function carregarPerfil() {
        try {
            const response = await fetch(`${APP_BASE_URL}/usuarios/${userIdToFetch}`);
            if (!response.ok) throw new Error("Usuário não encontrado");

            const usuario = await response.json();

            displayNome.textContent = `${usuario.nome} ${usuario.sobrenome}`;
            displayUsername.textContent = `@${usuario.username}`;
            displayBio.textContent = usuario.bio || "> Olá, mundo! Bem-vindo ao meu perfil.";

            document.querySelector('#edit-nome').value = usuario.nome;
            document.querySelector('#edit-sobrenome').value = usuario.sobrenome;
            document.querySelector('#edit-bio').value = usuario.bio || "";

            // Só mostra o botão editar se for o SEU perfil
            if (userIdToFetch == loggedUserId) {
                btnEditar.style.display = 'block';
            } else {
                btnEditar.style.display = 'none';
            }
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
        }
    }

    // ALTERNAR PARA MODO EDIÇÃO
    btnEditar.addEventListener('click', () => {
        document.getElementById('view-mode').style.display = 'none';
        document.getElementById('edit-mode').style.display = 'flex';
        btnEditar.style.display = 'none';
    });

    // SALVAR ALTERAÇÕES (Update)
    btnSalvar.addEventListener('click', async () => {
        const novosDados = {
            id: parseInt(loggedUserId),
            nome: document.querySelector('#edit-nome').value,
            sobrenome: document.querySelector('#edit-sobrenome').value,
            bio: document.querySelector('#edit-bio').value
        };

        try {
            const response = await fetch(`${APP_BASE_URL}/usuarios/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novosDados)
            });

            if (response.ok) {
                alert("Perfil atualizado com sucesso!");
                window.location.reload();
            } else {
                alert("Erro ao salvar alterações no servidor.");
            }
        } catch (error) {
            console.error("Erro de conexão:", error);
            alert("Erro de conexão com o servidor.");
        }
    });

    carregarPerfil();
});