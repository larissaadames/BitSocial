const APP_BASE_URL = "http://127.0.0.1:8000";

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const targetUserId = params.get('id'); 
    const loggedUserId = localStorage.getItem('userId');
    const userIdToFetch = targetUserId || loggedUserId;

    if (!userIdToFetch || userIdToFetch === "null") {
        window.location.href = "../Login/login.html";
        return;
    }

    // --- 1. LÓGICA DE BUSCA (IGUAL À HOME) ---
    const searchInput = document.getElementById("search-bar");
    const resultsBox = document.getElementById("search-results");

    if (searchInput) {
        searchInput.addEventListener("input", async () => {
            const termo = searchInput.value.trim();
            if (termo.length < 2) { resultsBox.style.display = "none"; return; }
            try {
                const response = await fetch(`${APP_BASE_URL}/usuarios/busca?username=${encodeURIComponent(termo)}`);
                const usuarios = await response.json();
                resultsBox.innerHTML = usuarios.map(u => `
                    <div class="search-item" onclick="window.location.href='perfil.html?id=${u.id}'">
                        <strong>@${u.username}</strong>
                        <span>${u.nome} ${u.sobrenome}</span>
                    </div>
                `).join("");
                resultsBox.style.display = "block";
            } catch (e) { console.error(e); }
        });
    }

    // --- 2. CARREGAR DADOS DO PERFIL ---
    const carregarPerfil = async () => {
        try {
            const response = await fetch(`${APP_BASE_URL}/usuarios/${userIdToFetch}`);
            if (!response.ok) return;
            const u = await response.json();

            // Preencher Visualização
            document.getElementById('display-nome-completo').textContent = `${u.nome} ${u.sobrenome}`;
            document.getElementById('display-username').textContent = `@${u.username}`;
            document.getElementById('display-bio').textContent = u.bio || "> Sem biografia.";
            document.getElementById('display-telefone').textContent = u.telefone ? `📞 ${u.telefone}` : "";
            document.getElementById('display-dtNasc').textContent = u.dtNasc ? `🎂 ${u.dtNasc}` : "";

            // Lógica da Foto: Banco -> bitPerfil.png
            const foto = u.foto_url && u.foto_url.length > 10 ? u.foto_url : '../img/bitPerfil.png';
            document.getElementById('display-avatar').style.backgroundImage = `url('${foto}')`;
            document.getElementById('header-avatar').style.backgroundImage = `url('${foto}')`;

            // Preencher Edição
            document.getElementById('edit-nome').value = u.nome;
            document.getElementById('edit-sobrenome').value = u.sobrenome;
            document.getElementById('edit-bio').value = u.bio || "";
            document.getElementById('edit-telefone').value = u.telefone || "";
            document.getElementById('edit-dtNasc').value = u.dtNasc || "";

            // Mostrar botão de edição apenas se for o dono do perfil
            if (userIdToFetch == loggedUserId) {
                document.getElementById('btn-edit-perfil').style.display = 'block';
                document.getElementById('avatar-overlay').style.display = 'flex';
            } else {
                document.getElementById('avatar-overlay').style.display = 'none';
            }
        } catch (e) { console.error(e); }
    };

    // --- 3. LÓGICA DE UPLOAD DE FOTO ---
    const avatarWrapper = document.querySelector('.avatar-wrapper');
    const fileInput = document.getElementById('file-input');

    avatarWrapper.addEventListener('click', () => {
        if (userIdToFetch == loggedUserId) fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target.result;
            // Preview imediato
            document.getElementById('display-avatar').style.backgroundImage = `url('${base64}')`;
            document.getElementById('header-avatar').style.backgroundImage = `url('${base64}')`;
            // Salva no banco (via função de update)
            await salvarAlteracoes(base64);
        };
        reader.readAsDataURL(file);
    });

    // --- 4. SALVAR ALTERAÇÕES ---
    const salvarAlteracoes = async (novaFoto = null) => {
        const dados = {
            id: parseInt(loggedUserId),
            nome: document.getElementById('edit-nome').value,
            sobrenome: document.getElementById('edit-sobrenome').value,
            bio: document.getElementById('edit-bio').value,
            telefone: document.getElementById('edit-telefone').value,
            dtNasc: document.getElementById('edit-dtNasc').value,
            foto_url: novaFoto || null
        };

        try {
            const res = await fetch(`${APP_BASE_URL}/usuarios/update`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(dados)
            });
            if (res.ok && !novaFoto) window.location.reload();
        } catch (e) { console.error(e); }
    };

    document.getElementById('btn-save-perfil').addEventListener('click', () => salvarAlteracoes());
    document.getElementById('btn-edit-perfil').addEventListener('click', () => {
        document.getElementById('view-mode').style.display = 'none';
        document.getElementById('edit-mode').style.display = 'block';
    });
    document.getElementById('btn-cancel-edit').addEventListener('click', () => window.location.reload());

    carregarPerfil();
});