// 1. Configuração da URL base para as requisições
const APP_BASE_URL = (() => {
  const { protocol, hostname, port, origin } = window.location;
  const isLocalhost = hostname === "127.0.0.1" || hostname === "localhost";

  if (protocol === "file:") return "http://127.0.0.1:8000";
  if (isLocalhost && port !== "8000") return "http://127.0.0.1:8000";
  
  return origin;
})();

document.addEventListener('DOMContentLoaded', () => {
    
    const loggedUserId = localStorage.getItem('userId');
    const avatarElement = document.getElementById('header-avatar');
    const dropdown = document.getElementById('user-dropdown');
    const logoutTrigger = document.getElementById('btn-logout-trigger');
    const logoutModal = document.getElementById('logout-modal');
    const confirmLogoutBtn = document.getElementById('confirm-logout');
    const cancelLogoutBtn = document.getElementById('cancel-logout');

    // Redireciona se não houver usuário logado
    if (!loggedUserId) {
        window.location.href = "../Login/login.html";
        return;
    }

    // --- 1. CARREGAR AVATAR NO HEADER ---
    const carregarUsuarioNoHeader = async () => {
        if (!avatarElement) return;

        try {
            const response = await fetch(`${APP_BASE_URL}/usuarios/${loggedUserId}`);
            if (response.ok) {
                const u = await response.json();
                
                // Verifica se existe foto no banco, senão usa o placeholder
                const fotoFinal = (u.foto_url && u.foto_url.length > 50) ? u.foto_url : '../img/bitPerfil.png';
                
                avatarElement.style.backgroundImage = `url('${fotoFinal}')`;
                avatarElement.style.backgroundSize = "cover";
                avatarElement.style.backgroundPosition = "center";
            }
        } catch (error) { 
            console.error("Erro ao carregar avatar do cabeçalho:", error); 
        }
    };
    carregarUsuarioNoHeader();

    // --- 2. LÓGICA DO MENU DROPDOWN (LOGOUT) ---
    
    // Abrir/Fechar dropdown ao clicar no avatar
    avatarElement.addEventListener('click', (e) => {
        e.stopPropagation(); // Impede que o clique feche o menu imediatamente
        const isVisible = dropdown.style.display === 'flex';
        dropdown.style.display = isVisible ? 'none' : 'flex';
    });

    // Fechar dropdown ao clicar em qualquer outro lugar da tela
    document.addEventListener('click', () => {
        if (dropdown) dropdown.style.display = 'none';
    });

    // Abrir Modal de Confirmação ao clicar em "Sair" no menu
    if (logoutTrigger) {
        logoutTrigger.addEventListener('click', () => {
            logoutModal.style.display = 'flex';
        });
    }

    // Botão "Cancelar" do Modal
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', () => {
            logoutModal.style.display = 'none';
        });
    }

    // Botão "Confirmar" do Modal (Limpa dados e sai)
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            window.location.href = "../Login/login.html";
        });
    }

    // --- 3. LÓGICA DE BUSCA ---
    const searchInput = document.getElementById("search-bar");
    const resultsBox = document.getElementById("search-results");

    if (searchInput) {
        searchInput.addEventListener("input", async () => {
            const termo = searchInput.value.trim();
            if (termo.length < 2) { 
                resultsBox.style.display = "none"; 
                return; 
            }
            try {
                const response = await fetch(`${APP_BASE_URL}/usuarios/busca?username=${encodeURIComponent(termo)}`);
                const usuarios = await response.json();
                resultsBox.innerHTML = usuarios.map(u => `
                    <div class="search-item" onclick="window.location.href='../perfil/perfil.html?id=${u.id}'">
                        <strong>@${u.username}</strong>
                        <span>${u.nome} ${u.sobrenome}</span>
                    </div>
                `).join("");
                resultsBox.style.display = "block";
            } catch (e) { console.error("Erro na busca:", e); }
        });
    }

    // --- 4. LÓGICA DE VOTOS ---
    const postCards = document.querySelectorAll('.post-card');

    postCards.forEach(post => {
        const upBtn = post.querySelector('.upvote');
        const downBtn = post.querySelector('.downvote');
        const countSpan = post.querySelector('.vote-count');
        
        let userVote = 0; 
        let initialCount = parseInt(countSpan.textContent) || 0;

        const updateVote = (voteType) => {
            const isUp = voteType === 'up';
            const btn = isUp ? upBtn : downBtn;
            const otherBtn = isUp ? downBtn : upBtn;
            const activeClass = isUp ? 'upvoted' : 'downvoted';
            const otherClass = isUp ? 'downvoted' : 'upvoted';

            if (userVote === (isUp ? 1 : -1)) {
                userVote = 0;
                btn.classList.remove(activeClass);
            } else {
                userVote = isUp ? 1 : -1;
                btn.classList.add(activeClass);
                otherBtn.classList.remove(otherClass);
                
                btn.classList.add('animating');
                setTimeout(() => btn.classList.remove('animating'), 300);
            }

            countSpan.textContent = initialCount + userVote;
        };

        if (upBtn) upBtn.addEventListener('click', () => updateVote('up'));
        if (downBtn) downBtn.addEventListener('click', () => updateVote('down'));
    });
});