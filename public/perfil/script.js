// Lógica de URL dinâmica (Igual ao Login)
const APP_BASE_URL = (() => {
  const { protocol, hostname, port, origin } = window.location;
  const isLocalhost = hostname === "127.0.0.1" || hostname === "localhost";
  if (protocol === "file:") return "http://127.0.0.1:8000";
  if (isLocalhost && port !== "8000") return "http://127.0.0.1:8000";
  return origin;
})();

document.addEventListener('DOMContentLoaded', async () => {
    const searchSection = document.querySelector('.search-section');
    const searchInput = document.getElementById('main-search');
    const searchResults = document.getElementById('search-results');
    const tabButtons = document.querySelectorAll('.profile-tab');
    const postsList = document.getElementById('profile-posts-list');
    const feedCaption = document.getElementById('profile-feed-caption');
    const params = new URLSearchParams(window.location.search);
    const targetUserId = params.get('id');
    const token = localStorage.getItem('token');
    const LOGIN_PAGE_URL = `${APP_BASE_URL}/public/Login/login.html`;
    const MAX_OVERVIEW_POSTS = 5;
    let searchDebounceTimer;
    let lastSearchRequestId = 0;
    let activeTab = 'overview';
    let isOwnProfile = false;

    document.addEventListener('click', event => {
        if (searchSection && !searchSection.contains(event.target)) {
            ocultarResultadosBusca();
        }

        fecharMenusAbertos();
    });

    if (!(await validarSessao())) {
        return;
    }

    configurarBuscaUsuarios();

    const loggedUserId = localStorage.getItem('userId');
    const userIdToFetch = targetUserId || loggedUserId;

    if (!userIdToFetch) {
        encerrarSessaoEIrLogin();
        return;
    }

    const btnEditar = document.querySelector('#btn-edit-perfil');
    const btnSalvar = document.querySelector('#btn-save-perfil');
    const btnCreatePost = document.querySelector('#btn-create-post');
    const displayNome = document.querySelector('#display-nome-completo');
    const displayUsername = document.querySelector('#display-username');
    const displayBio = document.querySelector('#display-bio');

    if (btnCreatePost) {
        btnCreatePost.classList.add('is-hidden');
        btnCreatePost.style.display = 'none';
        btnCreatePost.setAttribute('hidden', 'hidden');
        btnCreatePost.setAttribute('aria-hidden', 'true');
    }

    if (btnEditar) {
        btnEditar.addEventListener('click', () => {
            document.getElementById('view-mode').style.display = 'none';
            document.getElementById('edit-mode').style.display = 'flex';
            btnEditar.style.display = 'none';
        });
    }

    if (btnSalvar) {
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
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(novosDados)
                });

                if (response.status === 401) {
                    encerrarSessaoEIrLogin('Sua sessao expirou. Faca login novamente.');
                    return;
                }

                if (response.ok) {
                    alert('Perfil atualizado com sucesso!');
                    window.location.reload();
                } else {
                    alert('Erro ao salvar alteracoes no servidor.');
                }
            } catch (error) {
                console.error('Erro de conexao:', error);
                alert('Erro de conexao com o servidor.');
            }
        });
    }

    configurarTabs();

    async function carregarPerfil() {
        try {
            const response = await fetch(`${APP_BASE_URL}/usuarios/${userIdToFetch}`);
            if (!response.ok) throw new Error('Usuario nao encontrado');

            const usuario = await response.json();

            displayNome.textContent = `${usuario.nome} ${usuario.sobrenome}`;
            displayUsername.textContent = `@${usuario.username}`;
            displayBio.textContent = usuario.bio || '> Ola, mundo! Bem-vindo ao meu perfil.';

            document.querySelector('#edit-nome').value = usuario.nome;
            document.querySelector('#edit-sobrenome').value = usuario.sobrenome;
            document.querySelector('#edit-bio').value = usuario.bio || "";

            isOwnProfile = String(userIdToFetch) === String(loggedUserId);

            if (btnEditar) {
                if (isOwnProfile) {
                    btnEditar.style.display = 'block';
                } else {
                    btnEditar.style.display = 'none';
                }
            }

            if (btnCreatePost) {
                btnCreatePost.classList.toggle('is-hidden', !isOwnProfile);
                btnCreatePost.style.display = isOwnProfile ? 'inline-flex' : 'none';
                if (isOwnProfile) {
                    btnCreatePost.removeAttribute('hidden');
                    btnCreatePost.setAttribute('aria-hidden', 'false');
                } else {
                    btnCreatePost.setAttribute('hidden', 'hidden');
                    btnCreatePost.setAttribute('aria-hidden', 'true');
                }
            }

            const savedTab = document.querySelector('.profile-tab[data-tab="saved"]');
            if (savedTab) {
                savedTab.classList.toggle('is-hidden', !isOwnProfile);
            }

            if (!isOwnProfile && activeTab === 'saved') {
                activeTab = 'posts';
            }

            atualizarTabs();
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            if (postsList) {
                postsList.innerHTML = '<p class="profile-empty">Nao foi possivel carregar o perfil.</p>';
            }
        }
    }

    await carregarPerfil();
    await carregarPostsPerfil();

    async function carregarPostsPerfil() {
        if (!postsList) {
            return;
        }

        postsList.innerHTML = `<p class="profile-loading">${mensagemCarregamentoPorAba()}</p>`;

        try {
            const endpoint = activeTab === 'saved'
                ? '/posts/saved'
                : `/usuarios/${userIdToFetch}/posts`;

            const response = await fetch(`${APP_BASE_URL}${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                encerrarSessaoEIrLogin('Sua sessao expirou. Faca login novamente.');
                return;
            }

            if (!response.ok) {
                throw new Error('Erro ao carregar posts do perfil.');
            }

            const posts = await response.json();
            const lista = Array.isArray(posts) ? posts : [];
            const listaRender = activeTab === 'overview'
                ? lista.slice(0, MAX_OVERVIEW_POSTS)
                : lista;

            renderizarPostsPerfil(listaRender, lista.length);
        } catch (error) {
            console.error('Erro ao carregar posts do perfil:', error);
            postsList.innerHTML =
                '<p class="profile-empty">Nao foi possivel carregar os posts deste perfil agora.</p>';
        }
    }

    function renderizarPostsPerfil(posts, total) {
        if (!postsList) {
            return;
        }

        postsList.innerHTML = '';

        if (!posts.length) {
            postsList.innerHTML = `<p class="profile-empty">${mensagemVazioPorAba()}</p>`;
            return;
        }

        if (activeTab === 'overview' && total > posts.length) {
            const resumo = document.createElement('p');
            resumo.className = 'profile-loading';
            resumo.textContent = `Mostrando ${posts.length} de ${total} posts. Abra a aba Posts para ver todos.`;
            postsList.appendChild(resumo);
        }

        posts.forEach((post, index) => {
            const card = criarCardPostPerfil(post, index);
            postsList.appendChild(card);
            configurarVotacao(card);
        });
    }

    function criarCardPostPerfil(post, index) {
        const card = document.createElement('article');
        card.className = 'profile-post-card post-enter';
        card.dataset.postId = String(post.id);
        card.style.animationDelay = `${Math.min(index * 40, 220)}ms`;

        const header = document.createElement('header');
        header.className = 'profile-post-header';

        const userMeta = document.createElement('div');
        userMeta.className = 'post-user-meta';

        const avatar = document.createElement('div');
        avatar.className = 'post-user-avatar';

        const userName = document.createElement('span');
        userName.className = 'post-user-name';
        userName.textContent = `@${post.username || 'usuario'}`;

        userMeta.appendChild(avatar);
        userMeta.appendChild(userName);

        if (Number(post.usuario_id) === Number(loggedUserId)) {
            const chip = document.createElement('span');
            chip.className = 'post-owner-chip';
            chip.textContent = 'Seu post';
            userMeta.appendChild(chip);
        }

        header.appendChild(userMeta);

        const actions = document.createElement('div');
        actions.className = 'post-header-actions';

        const menuWrapper = document.createElement('div');
        menuWrapper.className = 'post-menu-wrapper';

        const menuTrigger = document.createElement('button');
        menuTrigger.type = 'button';
        menuTrigger.className = 'post-menu-trigger';
        menuTrigger.setAttribute('aria-label', 'Mais opcoes');
        menuTrigger.innerHTML = '&#8942;';

        const menuContent = document.createElement('div');
        menuContent.className = 'post-menu-content';

        const denunciar = document.createElement('button');
        denunciar.type = 'button';
        denunciar.className = 'post-menu-item';
        denunciar.innerHTML = '<span class="menu-item-icon">!</span><span>Denunciar</span>';
        denunciar.addEventListener('click', () => {
            menuWrapper.classList.remove('open');
            alert('Funcionalidade de denuncia em breve.');
        });
        menuContent.appendChild(denunciar);

        if (Number(post.usuario_id) === Number(loggedUserId)) {
            const excluir = document.createElement('button');
            excluir.type = 'button';
            excluir.className = 'post-menu-item danger';
            excluir.innerHTML = '<span class="menu-item-icon">x</span><span>Excluir</span>';
            excluir.addEventListener('click', () => {
                menuWrapper.classList.remove('open');
                removerPost(post.id, card, excluir);
            });
            menuContent.appendChild(excluir);
        }

        menuTrigger.addEventListener('click', event => {
            event.stopPropagation();
            const shouldOpen = !menuWrapper.classList.contains('open');
            fecharMenusAbertos();
            if (shouldOpen) {
                menuWrapper.classList.add('open');
            }
        });

        menuContent.addEventListener('click', event => {
            event.stopPropagation();
        });

        menuWrapper.appendChild(menuTrigger);
        menuWrapper.appendChild(menuContent);
        actions.appendChild(menuWrapper);
        header.appendChild(actions);

        const content = document.createElement('div');
        content.className = 'profile-post-content';

        const text = document.createElement('p');
        text.className = 'profile-post-text';
        text.textContent = post.conteudo || '';
        content.appendChild(text);

        const footer = document.createElement('footer');
        footer.className = 'profile-post-footer';

        const votes = document.createElement('div');
        votes.className = 'post-votes';
        votes.innerHTML = [
            '<div class="vote-arrow upvote" aria-label="Upvote"></div>',
            '<span class="vote-count">0</span>',
            '<div class="vote-arrow downvote" aria-label="Downvote"></div>'
        ].join('');

        const social = document.createElement('div');
        social.className = 'post-social-actions';

        const shareButton = document.createElement('button');
        shareButton.type = 'button';
        shareButton.className = 'post-action-btn share-action-btn';
        shareButton.setAttribute('aria-label', 'Compartilhar post');
        shareButton.title = 'Compartilhar';
        shareButton.innerHTML = '&#10548;';
        shareButton.addEventListener('click', () => {
            compartilharPost(post, shareButton);
        });

        const saveButton = document.createElement('button');
        saveButton.type = 'button';
        saveButton.className = 'post-action-btn save-flag-btn';
        saveButton.setAttribute('aria-label', 'Salvar post');
        saveButton.innerHTML = '&#9873;';
        saveButton.classList.toggle('is-saved', Boolean(post.salvo));
        saveButton.title = post.salvo ? 'Remover dos salvos' : 'Salvar post';
        saveButton.setAttribute('aria-pressed', post.salvo ? 'true' : 'false');
        saveButton.addEventListener('click', () => {
            alternarPostSalvo(post.id, saveButton, card);
        });

        social.appendChild(shareButton);
        social.appendChild(saveButton);

        footer.appendChild(votes);
        footer.appendChild(social);

        card.appendChild(header);
        card.appendChild(content);
        card.appendChild(footer);

        return card;
    }

    function configurarVotacao(postElement) {
        const upBtn = postElement.querySelector('.upvote');
        const downBtn = postElement.querySelector('.downvote');
        const countSpan = postElement.querySelector('.vote-count');

        if (!upBtn || !downBtn || !countSpan) {
            return;
        }

        const baseCount = parseInt(countSpan.textContent, 10) || 0;
        let userVote = 0;

        function triggerAnimation(elemento) {
            elemento.classList.remove('animating');
            void elemento.offsetWidth;
            elemento.classList.add('animating');
        }

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
    }

    function atualizarContador(elemento, base, voto) {
        elemento.textContent = base + voto;

        if (voto === 1) {
            elemento.style.color = '#ff4d4d';
        } else if (voto === -1) {
            elemento.style.color = '#7b2ff7';
        } else {
            elemento.style.color = '#ffffff';
        }
    }

    async function removerPost(postId, postCard, triggerButton) {
        if (!token) {
            alert('Voce precisa estar logado para excluir posts.');
            return;
        }

        const confirmar = window.confirm('Tem certeza que deseja excluir este post? Essa acao nao pode ser desfeita.');
        if (!confirmar) {
            return;
        }

        triggerButton.disabled = true;
        triggerButton.classList.add('is-loading');

        try {
            const response = await fetch(`${APP_BASE_URL}/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                encerrarSessaoEIrLogin('Sua sessao expirou. Faca login novamente.');
                return;
            }

            if (!response.ok) {
                const detail = await extrairErro(response);
                throw new Error(detail || 'Nao foi possivel excluir este post.');
            }

            postCard.classList.add('is-removing');
            window.setTimeout(() => {
                postCard.remove();
                if (postsList && !postsList.querySelector('.profile-post-card')) {
                    postsList.innerHTML = `<p class="profile-empty">${mensagemVazioPorAba()}</p>`;
                }
            }, 240);
        } catch (error) {
            console.error('Erro ao excluir post no perfil:', error);
            alert(error.message || 'Erro inesperado ao excluir o post.');
            triggerButton.disabled = false;
            triggerButton.classList.remove('is-loading');
        }
    }

    async function alternarPostSalvo(postId, saveButton, postCard) {
        if (!token) {
            alert('Voce precisa estar logado para salvar posts.');
            return;
        }

        const estaSalvo = saveButton.classList.contains('is-saved');
        const method = estaSalvo ? 'DELETE' : 'POST';

        saveButton.disabled = true;
        saveButton.classList.add('is-loading');

        try {
            const response = await fetch(`${APP_BASE_URL}/posts/${postId}/save`, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                encerrarSessaoEIrLogin('Sua sessao expirou. Faca login novamente.');
                return;
            }

            if (!response.ok) {
                const detail = await extrairErro(response);
                throw new Error(detail || 'Nao foi possivel atualizar os salvos.');
            }

            const agoraSalvo = !estaSalvo;
            saveButton.classList.toggle('is-saved', agoraSalvo);
            saveButton.setAttribute('aria-pressed', agoraSalvo ? 'true' : 'false');
            saveButton.title = agoraSalvo ? 'Remover dos salvos' : 'Salvar post';

            if (activeTab === 'saved' && !agoraSalvo) {
                postCard.classList.add('is-removing');
                window.setTimeout(() => {
                    postCard.remove();
                    if (postsList && !postsList.querySelector('.profile-post-card')) {
                        postsList.innerHTML = '<p class="profile-empty">Voce ainda nao salvou nenhum post.</p>';
                    }
                }, 240);
            }
        } catch (error) {
            console.error('Erro ao salvar/desfazer salvo no perfil:', error);
            alert(error.message || 'Erro inesperado ao atualizar os salvos.');
        } finally {
            saveButton.disabled = false;
            saveButton.classList.remove('is-loading');
        }
    }

    async function compartilharPost(post, shareButton) {
        const texto = `@${post.username || 'usuario'}: ${post.conteudo || ''}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Post do SocialBit',
                    text: texto,
                });
                return;
            }

            await copiarTexto(texto);
            shareButton.classList.add('is-shared');
            window.setTimeout(() => {
                shareButton.classList.remove('is-shared');
            }, 900);
        } catch (error) {
            if (error && error.name === 'AbortError') {
                return;
            }

            console.error('Erro ao compartilhar no perfil:', error);
            alert('Nao foi possivel compartilhar este post agora.');
        }
    }

    async function copiarTexto(texto) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(texto);
            return;
        }

        const textarea = document.createElement('textarea');
        textarea.value = texto;
        textarea.setAttribute('readonly', 'readonly');
        textarea.style.position = 'fixed';
        textarea.style.top = '-1000px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
    }

    function configurarTabs() {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.getAttribute('data-tab') || 'overview';
                if (tab === 'saved' && !isOwnProfile) {
                    return;
                }

                activeTab = tab;
                atualizarTabs();
                carregarPostsPerfil();
            });
        });
    }

    function atualizarTabs() {
        tabButtons.forEach(button => {
            button.classList.toggle('active', button.getAttribute('data-tab') === activeTab);
        });

        if (!feedCaption) {
            return;
        }

        if (activeTab === 'saved') {
            feedCaption.textContent = 'Posts que voce salvou';
            return;
        }

        if (activeTab === 'posts') {
            feedCaption.textContent = isOwnProfile
                ? 'Todos os seus posts'
                : 'Todos os posts deste usuario';
            return;
        }

        feedCaption.textContent = isOwnProfile
            ? 'Visao geral do seu perfil'
            : 'Visao geral do perfil';
    }

    function mensagemCarregamentoPorAba() {
        if (activeTab === 'saved') {
            return 'Carregando seus posts salvos...';
        }

        if (activeTab === 'posts') {
            return 'Carregando posts do usuario...';
        }

        return 'Carregando visao geral...';
    }

    function mensagemVazioPorAba() {
        if (activeTab === 'saved') {
            return 'Voce ainda nao salvou nenhum post.';
        }

        if (activeTab === 'posts') {
            return isOwnProfile
                ? 'Voce ainda nao publicou nenhum post.'
                : 'Este usuario ainda nao publicou posts.';
        }

        return isOwnProfile
            ? 'Seu perfil ainda nao possui conteudo para overview.'
            : 'Este perfil ainda nao possui conteudo para overview.';
    }

    function fecharMenusAbertos() {
        document.querySelectorAll('.post-menu-wrapper.open').forEach(menu => {
            menu.classList.remove('open');
        });
    }

    async function extrairErro(response) {
        try {
            const data = await response.json();
            return data.detail || '';
        } catch {
            return '';
        }
    }

    async function validarSessao() {
        const loggedId = localStorage.getItem('userId');
        if (!token || !loggedId) {
            encerrarSessaoEIrLogin();
            return false;
        }

        try {
            const response = await fetch(`${APP_BASE_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                encerrarSessaoEIrLogin("Sua sessao expirou. Faca login novamente.");
                return false;
            }

            if (!response.ok) {
                console.error("Falha ao validar sessao no Perfil.");
                return true;
            }

            const sessao = await response.json();
            if (sessao?.id) {
                localStorage.setItem('userId', String(sessao.id));
            }
            if (sessao?.username) {
                localStorage.setItem('username', sessao.username);
            }

            return true;
        } catch (error) {
            console.error("Erro ao validar sessao no Perfil:", error);
            return true;
        }
    }

    function encerrarSessaoEIrLogin(mensagem = "") {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');

        if (mensagem) {
            alert(mensagem);
        }

        window.location.href = LOGIN_PAGE_URL;
    }

    function configurarBuscaUsuarios() {
        if (!searchInput || !searchResults) {
            return;
        }

        searchInput.addEventListener('input', () => {
            const termo = searchInput.value.trim();
            clearTimeout(searchDebounceTimer);

            if (termo.length < 2) {
                ocultarResultadosBusca();
                return;
            }

            searchDebounceTimer = window.setTimeout(() => {
                buscarUsuarios(termo);
            }, 260);
        });

        searchInput.addEventListener('focus', () => {
            if (searchResults.children.length > 0) {
                searchResults.classList.add('is-visible');
            }
        });

        searchInput.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                ocultarResultadosBusca();
                searchInput.blur();
                return;
            }

            if (event.key === 'Enter') {
                const primeiroResultado = searchResults.querySelector('.search-result-item');
                if (primeiroResultado) {
                    event.preventDefault();
                    primeiroResultado.click();
                }
            }
        });
    }

    async function buscarUsuarios(termo) {
        if (!searchResults) {
            return;
        }

        const requestId = ++lastSearchRequestId;

        try {
            const response = await fetch(
                `${APP_BASE_URL}/usuarios/busca?username=${encodeURIComponent(termo)}`
            );

            if (requestId !== lastSearchRequestId) {
                return;
            }

            if (!response.ok) {
                throw new Error('Falha ao buscar usuarios');
            }

            const usuarios = await response.json();
            renderizarResultadosBusca(Array.isArray(usuarios) ? usuarios : []);
        } catch (error) {
            console.error('Erro na busca de usuarios:', error);
            renderizarResultadosBusca([]);
        }
    }

    function renderizarResultadosBusca(usuarios) {
        if (!searchResults) {
            return;
        }

        searchResults.innerHTML = '';

        if (!usuarios.length) {
            const vazio = document.createElement('div');
            vazio.className = 'search-result-empty';
            vazio.textContent = 'Nenhum usuario encontrado.';
            searchResults.appendChild(vazio);
            searchResults.classList.add('is-visible');
            return;
        }

        usuarios.forEach(usuario => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'search-result-item';
            item.innerHTML = [
                `<span class="search-result-username">@${usuario.username || 'usuario'}</span>`,
                `<span class="search-result-name">${(usuario.nome || '')} ${(usuario.sobrenome || '')}</span>`,
            ].join('');

            item.addEventListener('click', () => {
                window.location.href = `perfil.html?id=${usuario.id}`;
            });

            searchResults.appendChild(item);
        });

        searchResults.classList.add('is-visible');
    }

    function ocultarResultadosBusca() {
        if (!searchResults) {
            return;
        }

        searchResults.classList.remove('is-visible');
        searchResults.innerHTML = '';
    }
});