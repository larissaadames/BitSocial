const APP_BASE_URL = "http://127.0.0.1:8000";

document.addEventListener('DOMContentLoaded', async () => {
    // 1. GESTÃO DE CONTEXTO
    const params = new URLSearchParams(window.location.search);
    const targetUserId = params.get('id'); 
    const loggedUserId = localStorage.getItem('userId');
    const userIdToFetch = targetUserId || loggedUserId;

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
    const inputDataNasc = document.getElementById('edit-dtNasc');
    const btnSalvar = document.getElementById('btn-save-perfil');
    const btnCancelar = document.getElementById('btn-cancel-edit');
    
    const normalizeUsername = value => {
        const cleaned = String(value || '').trim().replace(/^@+/, '');
        return cleaned || 'usuario';
    };
    const formatUsername = value => `@${normalizeUsername(value)}`;

    // --- CONFIGURAÇÃO DA IDADE MÍNIMA (16 ANOS) ---
    const hoje = new Date();
    const dataMinima16 = new Date();
    dataMinima16.setFullYear(hoje.getFullYear() - 16);
    const dataLimite = dataMinima16.toISOString().split('T')[0];
    if (inputDataNasc) inputDataNasc.max = dataLimite;

    // 3. SISTEMA DE NOTIFICAÇÕES
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

    // --- 4. LOGOUT ---
    headerAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = dropdown.style.display === 'flex';
        dropdown.style.display = isVisible ? 'none' : 'flex';
    });

    document.addEventListener('click', () => { if(dropdown) dropdown.style.display = 'none'; });

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

    // 5. MÁSCARA TELEFONE
    inputTelefone.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.substring(0, 11);
        let r = v.replace(/^(\d{2})(\d)/g, '($1) $2');
        r = r.replace(/(\d{5})(\d)/, '$1-$2');
        e.target.value = r;
    });

    // --- 8. CARREGAR PERFIL ---
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
                document.getElementById('edit-nome').value = u.nome;
                document.getElementById('edit-sobrenome').value = u.sobrenome;
                document.getElementById('edit-bio').value = u.bio || "";
                document.getElementById('edit-telefone').value = u.telefone || "";
                document.getElementById('edit-dtNasc').value = u.dtNasc || "";
            }
        } catch (e) { showNotification("Erro ao carregar dados.", "error"); }
    };

    // --- 9. SALVAR ALTERAÇÕES (COM FIX DE DELAY) ---
    const salvarAlteracoes = async (novaFoto = null) => {
        const nome = document.getElementById('edit-nome').value.trim();
        const sobrenome = document.getElementById('edit-sobrenome').value.trim();
        const telefoneVal = inputTelefone.value.trim();
        const dtNascVal = inputDataNasc.value;
        
        if (nome.length < 2 || sobrenome.length < 2) {
            showNotification("Nome e sobrenome muito curtos.", "error");
            return;
        }

        // BLOQUEIO DO BOTÃO PARA EVITAR MULTI-CLICKS
        const originalText = btnSalvar.textContent;
        btnSalvar.disabled = true;
        btnSalvar.textContent = "Salvando...";
        btnCancelar.style.pointerEvents = "none";
        btnCancelar.style.opacity = "0.5";

        const dados = {
            id: parseInt(loggedUserId),
            nome: nome,
            sobrenome: sobrenome,
            bio: document.getElementById('edit-bio').value,
            telefone: telefoneVal,
            dtNasc: dtNascVal,
            foto_url: novaFoto
        };

        try {
            const res = await fetch(`${APP_BASE_URL}/usuarios/update`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(dados)
            });

            if (res.ok) {
                showNotification("Alterações gravadas com sucesso!");
                // Se for só texto, recarrega para atualizar a view
                if (!novaFoto) setTimeout(() => window.location.reload(), 800);
            } else {
                const erro = await res.json();
                showNotification(erro.detail || "Erro no servidor.", "error");
                // REATIVA BOTÕES EM CASO DE ERRO
                btnSalvar.disabled = false;
                btnSalvar.textContent = originalText;
                btnCancelar.style.pointerEvents = "auto";
                btnCancelar.style.opacity = "1";
            }
        } catch (e) { 
            showNotification("Erro de conexão.", "error");
            btnSalvar.disabled = false;
            btnSalvar.textContent = originalText;
            btnCancelar.style.pointerEvents = "auto";
            btnCancelar.style.opacity = "1";
        }
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
            await salvarAlteracoes(base64);
        };
        reader.readAsDataURL(e.target.files[0]);
    });

    btnSalvar.addEventListener('click', () => salvarAlteracoes());
    
    document.getElementById('btn-edit-perfil').addEventListener('click', () => {
        document.getElementById('view-mode').style.display = 'none';
        document.getElementById('edit-mode').style.display = 'block';
    });

    btnCancelar.addEventListener('click', () => window.location.reload());

    // --- 11. ELIMINAÇÃO ---
    const deleteModal = document.getElementById('delete-modal');
    document.getElementById('delete-account-btn').addEventListener('click', () => {
        deleteModal.style.display = 'flex';
    });
    document.getElementById('cancel-delete').addEventListener('click', () => {
        deleteModal.style.display = 'none';
    });
    document.getElementById('confirm-delete').addEventListener('click', async () => {
        const res = await fetch(`${APP_BASE_URL}/usuarios/${loggedUserId}`, { method: 'DELETE' });
        if (res.ok) {
            localStorage.clear();
            window.location.href = "../Login/login.html";
        }
    });

    carregarPerfil();  
});