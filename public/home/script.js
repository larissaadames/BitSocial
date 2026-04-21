// 1. Configuração da URL base para as requisições
const APP_BASE_URL = (() => {
  const { protocol, hostname, port, origin } = window.location;
  const isLocalhost = hostname === "127.0.0.1" || hostname === "localhost";

  if (protocol === "file:") return "http://127.0.0.1:8000";
  if (isLocalhost && port !== "8000") return "http://127.0.0.1:8000";
  
  return origin;
})();

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CARREGAR AVATAR NO HEADER ---
    const carregarUsuarioNoHeader = async () => {
        const userId = localStorage.getItem('userId');
        const avatarElement = document.getElementById('header-avatar');
        if (!userId || !avatarElement) return;

        try {
            const response = await fetch(`${APP_BASE_URL}/usuarios/${userId}`);
            if (response.ok) {
                // Forçando a imagem padrão bitPerfil.png
                avatarElement.style.backgroundImage = "url('../img/bitPerfil.png')";
                avatarElement.style.backgroundSize = "cover";
                avatarElement.style.backgroundPosition = "center";
            }
        } catch (error) { console.error("Erro no avatar:", error); }
    };
    carregarUsuarioNoHeader();

    // --- 2. LÓGICA DE BUSCA ---
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
            } catch (e) { console.error(e); }
        });
    }

    // --- 3. LÓGICA DE VOTOS (RESTAURADA COM ANIMAÇÕES) ---
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

            // Lógica de toggle
            if (userVote === (isUp ? 1 : -1)) {
                userVote = 0;
                btn.classList.remove(activeClass);
            } else {
                userVote = isUp ? 1 : -1;
                btn.classList.add(activeClass);
                otherBtn.classList.remove(otherClass);
                
                // Dispara a animação de "pop" do seu CSS
                btn.classList.add('animating');
                setTimeout(() => btn.classList.remove('animating'), 300);
            }

            countSpan.textContent = initialCount + userVote;
        };

        if (upBtn) upBtn.addEventListener('click', () => updateVote('up'));
        if (downBtn) downBtn.addEventListener('click', () => updateVote('down'));
    });
});