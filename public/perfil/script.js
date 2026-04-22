const APP_BASE_URL = "http://127.0.0.1:8000";

document.addEventListener('DOMContentLoaded', async () => {
    // 1. GESTÃO DE CONTEXTO
    const params = new URLSearchParams(window.location.search);
    const targetUserId = params.get('id'); 
    const loggedUserId = localStorage.getItem('userId');
    const userIdToFetch = targetUserId || loggedUserId;

    // Redireciona se não houver utilizador logado
    if (!loggedUserId || loggedUserId === "null") {
        window.location.href = "../Login/login.html";
        return;
    }

    // 2. ELEMENTOS DA INTERFACE
    const notificationContainer = document.getElementById('notification-container');
    const displayAvatar = document.getElementById('display-avatar');
    const headerAvatar = document.getElementById('header-avatar');
    const dropdown = document.getElementById('user-dropdown');
    const logoutModal = document.getElementById('logout-modal');
    const inputTelefone = document.getElementById('edit-telefone');
    const normalizeUsername = value => {
        const cleaned = String(value || '').trim().replace(/^@+/, '');
        return cleaned || 'usuario';
    };
    const formatUsername = value => `@${normalizeUsername(value)}`;

    // 3. SISTEMA DE NOTIFICAÇÕES (TOASTS)
    const showNotification = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        notificationContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    };

    // --- 4. LÓGICA DE LOGOUT (MODAL E DROPDOWN) ---
    headerAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = dropdown.style.display === 'flex';
        dropdown.style.display = isVisible ? 'none' : 'flex';
    });

    document.addEventListener('click', () => { dropdown.style.display = 'none'; });

    document.getElementById('btn-logout-trigger').addEventListener('click', () => {
        logoutModal.style.display = 'flex';
    });

    document.getElementById('cancel-logout').addEventListener('click', () => {
        logoutModal.style.display = 'none';
    });

    document.getElementById('confirm-logout').addEventListener('click', () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        window.location.href = "../Login/login.html";
    });

    // 5. MÁSCARA DE TELEFONE
    inputTelefone.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.substring(0, 11);
        let r = v.replace(/^(\d{2})(\d)/g, '($1) $2');
        r = r.replace(/(\d{5})(\d)/, '$1-$2');
        e.target.value = r;
    });

    // 6. LÓGICA DE BUSCA
    const searchInput = document.getElementById("search-bar");
    const resultsBox = document.getElementById("search-results");
    if (searchInput) {
        searchInput.addEventListener("input", async () => {
            const termo = searchInput.value.trim();
            if (termo.length < 2) { resultsBox.style.display = "none"; return; }
            try {
                const res = await fetch(`${APP_BASE_URL}/usuarios/busca?username=${encodeURIComponent(termo)}`);
                const usuarios = await res.json();
                resultsBox.innerHTML = usuarios.map(u => `
                    <div class="search-item" onclick="window.location.href='perfil.html?id=${u.id}'">
                        <strong>${formatUsername(u.username)}</strong>
                        <span>${u.nome} ${u.sobrenome}</span>
                    </div>
                `).join("");
                resultsBox.style.display = "block";
            } catch (e) { console.error(e); }
        });
    }

    // --- 7. CARREGAR HEADER (Sempre o LOGADO) ---
    const carregarHeader = async () => {
        try {
            const res = await fetch(`${APP_BASE_URL}/usuarios/${loggedUserId}`);
            if (res.ok) {
                const u = await res.json();
                const foto = (u.foto_url && u.foto_url.length > 50) ? u.foto_url : '../img/bitPerfil.png';
                headerAvatar.style.backgroundImage = `url('${foto}')`;
            }
        } catch (e) { console.error(e); }
    };

    // --- 8. CARREGAR PERFIL (Dono ou Visitado) ---
    const carregarPerfil = async () => {
        try {
            const res = await fetch(`${APP_BASE_URL}/usuarios/${userIdToFetch}`);
            if (!res.ok) throw new Error();
            const u = await res.json();

            document.getElementById('display-nome-completo').textContent = `${u.nome} ${u.sobrenome}`;
            document.getElementById('display-username').textContent = formatUsername(u.username);
            document.getElementById('display-bio').textContent = u.bio || "> Sem biografia.";
            document.getElementById('display-telefone').textContent = u.telefone ? `📞 ${u.telefone}` : "";
            document.getElementById('display-dtNasc').textContent = u.dtNasc ? `🎂 ${u.dtNasc}` : "";

            const fotoPerfil = (u.foto_url && u.foto_url.length > 50) ? u.foto_url : '../img/bitPerfil.png';
            displayAvatar.style.backgroundImage = `url('${fotoPerfil}')`;

            if (userIdToFetch == loggedUserId) {
                document.getElementById('btn-edit-perfil').style.display = 'block';
                //document.getElementById('avatar-overlay').style.display = 'flex';
                document.getElementById('edit-nome').value = u.nome;
                document.getElementById('edit-sobrenome').value = u.sobrenome;
                document.getElementById('edit-bio').value = u.bio || "";
                document.getElementById('edit-telefone').value = u.telefone || "";
                document.getElementById('edit-dtNasc').value = u.dtNasc || "";
            }
        } catch (e) { showNotification("Erro ao carregar dados.", "error"); }
    };

    // 9. SALVAR ALTERAÇÕES
    const salvarAlteracoes = async (novaFoto = null) => {
        const nome = document.getElementById('edit-nome').value.trim();
        const telefone = inputTelefone.value.trim();
        
        if (nome.length < 2) {
            showNotification("Nome inválido.", "error");
            return;
        }

        const dados = {
            id: parseInt(loggedUserId),
            nome: nome,
            sobrenome: document.getElementById('edit-sobrenome').value,
            bio: document.getElementById('edit-bio').value,
            telefone: telefone,
            dtNasc: document.getElementById('edit-dtNasc').value,
            foto_url: novaFoto
        };

        try {
            const res = await fetch(`${APP_BASE_URL}/usuarios/update`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(dados)
            });
            if (res.ok) {
                showNotification("Sucesso!");
                if (!novaFoto) setTimeout(() => window.location.reload(), 1000);
            }
        } catch (e) { showNotification("Erro ao salvar.", "error"); }
    };

    // 10. UPLOAD DE FOTO
    document.getElementById('avatar-wrapper').addEventListener('click', () => {
        if (userIdToFetch == loggedUserId) document.getElementById('file-input').click();
    });

    document.getElementById('file-input').addEventListener('change', (e) => {
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const base64 = ev.target.result;
            displayAvatar.style.backgroundImage = `url('${base64}')`;
            headerAvatar.style.backgroundImage = `url('${base64}')`;
            await salvarAlteracoes(base64);
        };
        reader.readAsDataURL(e.target.files[0]);
    });

    document.getElementById('btn-save-perfil').addEventListener('click', () => salvarAlteracoes());
    document.getElementById('btn-edit-perfil').addEventListener('click', () => {
        document.getElementById('view-mode').style.display = 'none';
        document.getElementById('edit-mode').style.display = 'block';
    });
    document.getElementById('btn-cancel-edit').addEventListener('click', () => window.location.reload());
    
    carregarHeader();
    carregarPerfil();  

    // --- 11. LÓGICA DE EXCLUSÃO DE CONTA ---
    // --- LÓGICA DE ELIMINAÇÃO DE CONTA ---
    const deleteBtn = document.getElementById('delete-account-btn');
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');

    if (deleteBtn) {
        // Abrir o modal
        deleteBtn.addEventListener('click', () => {
            deleteModal.style.display = 'flex';
        });

        // Fechar o modal
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });

        // Confirmar e enviar para o servidor
        confirmDeleteBtn.addEventListener('click', async () => {
            try {
                // Usa o APP_BASE_URL que já definiste no topo
                const res = await fetch(`${APP_BASE_URL}/usuarios/${loggedUserId}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    showNotification("Conta eliminada com sucesso.", "success");
                    
                    // 1. Limpa tudo explicitamente
                    localStorage.removeItem('userId');
                    localStorage.removeItem('username');
                    localStorage.removeItem('access_token');
                    localStorage.clear(); 

                    // 2. Aguarda e redireciona
                    setTimeout(() => {
                        window.location.href = "../Login/login.html";
                    }, 2000);
                } else {
                    showNotification("Erro ao comunicar com o servidor.", "error");
                }
            } catch (e) {
                console.error("Erro de conexão:", e);
                showNotification("Erro de conexão com o servidor.", "error");
            } finally {
                deleteModal.style.display = 'none';
            }
        });
    }
   
});