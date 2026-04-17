/**
 * BitSocial - Script da Home
 * Gerencia a navegação lateral e o sistema de votos (estilo Reddit) com animações.
 */
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const posts = document.querySelectorAll('.post-card');

    /**
     * 1. Navegação da Barra Lateral
     */
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const target = item.getAttribute('data-target');
            const postPrompt = document.querySelector('.create-post-card');
            
            if (target === 'saved') {
                if (postPrompt) postPrompt.style.display = 'none';
            } else {
                if (postPrompt) postPrompt.style.display = 'flex';
            }
        });
    });

    /**
     * 2. Lógica de Votação e Animações
     */
    posts.forEach(post => {
        const upBtn = post.querySelector('.upvote');
        const downBtn = post.querySelector('.downvote');
        const countSpan = post.querySelector('.vote-count');

        if (!upBtn || !downBtn || !countSpan) return;

        // Valor base do post (estado neutro)
        let baseCount = parseInt(countSpan.textContent);
        let userVote = 0; // 0: neutro, 1: upvoted, -1: downvoted

        // Função para disparar a animação de pop
        function triggerAnimation(el) {
            el.classList.remove('animating');
            void el.offsetWidth; // Força o reflow para reiniciar a animação
            el.classList.add('animating');
        }

        // Evento de clique no Upvote
        upBtn.addEventListener('click', () => {
            triggerAnimation(upBtn);
            if (userVote === 1) {
                userVote = 0;
                upBtn.classList.remove('upvoted');
            } else {
                userVote = 1;
                upBtn.classList.add('upvoted');
                downBtn.classList.remove('downvoted');
            }
            atualizarContador(countSpan, baseCount, userVote);
        });

        // Evento de clique no Downvote
        downBtn.addEventListener('click', () => {
            triggerAnimation(downBtn);
            if (userVote === -1) {
                userVote = 0;
                downBtn.classList.remove('downvoted');
            } else {
                userVote = -1;
                downBtn.classList.add('downvoted');
                upBtn.classList.remove('upvoted');
            }
            atualizarContador(countSpan, baseCount, userVote);
        });
    });

    /**
     * Função para atualizar o número exibido e a cor do contador.
     */
    function atualizarContador(elemento, base, voto) {
        elemento.textContent = base + voto;
        
        if (voto === 1) {
            elemento.style.color = "#ff4d4d"; // Vermelho (Upvote)
        } else if (voto === -1) {
            elemento.style.color = "#7b2ff7"; // Roxo (Downvote)
        } else {
            elemento.style.color = "#ffffff"; // Branco (Neutro)
        }
    }
});