/**
 * BitSocial - Script da Home
 * Renderiza o feed dinamicamente e permite excluir apenas os posts do próprio usuário.
 */
const APP_BASE_URL = (() => {
    const { protocol, hostname, port, origin } = window.location;
    const isLocalhost = hostname === "127.0.0.1" || hostname === "localhost";

    if (protocol === "file:") {
        return "http://127.0.0.1:8000";
    }

    if (isLocalhost && port !== "8000") {
        return "http://127.0.0.1:8000";
    }

    return origin;
})();

document.addEventListener("DOMContentLoaded", async () => {
    const navItems = document.querySelectorAll(".nav-item");
    const searchSection = document.querySelector(".search-section");
    const searchInput = document.getElementById("main-search");
    const searchResults = document.getElementById("search-results");
    const postPrompt = document.querySelector(".create-post-card");
    const togglePostButton = document.getElementById("btn-toggle-post");
    const postComposerForm = document.getElementById("post-composer-form");
    const postContentInput = document.getElementById("post-content");
    const postCounter = document.getElementById("post-counter");
    const cancelPostButton = document.getElementById("btn-cancel-post");
    const sendPostButton = document.getElementById("btn-send-post");
    const feedScroll = document.getElementById("feed-scroll");
    const loggedUserId = Number(localStorage.getItem("userId") || 0);
    const loggedUsername = localStorage.getItem("username") || "usuario";
    const token = localStorage.getItem("token");
    const MAX_POST_LENGTH = 500;
    const LOGIN_PAGE_URL = `${APP_BASE_URL}/public/Login/login.html`;
    let activeFeedTarget = "home";
    let searchDebounceTimer;
    let lastSearchRequestId = 0;

    document.addEventListener("click", event => {
        fecharMenusAbertos();

        if (searchSection && !searchSection.contains(event.target)) {
            ocultarResultadosBusca();
        }
    });

    const sessaoValida = await validarSessao();
    if (!sessaoValida) {
        return;
    }

    if (postCounter && postContentInput) {
        postCounter.textContent = `${postContentInput.value.length}/${MAX_POST_LENGTH}`;
    }

    configurarBuscaUsuarios();

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");

            const target = item.getAttribute("data-target");
            activeFeedTarget = target === "saved" ? "saved" : "home";

            if (!postPrompt) {
                return;
            }

            postPrompt.style.display = activeFeedTarget === "saved" ? "none" : "flex";

            if (activeFeedTarget === "saved") {
                fecharComposer();
            }

            carregarPosts();
        });
    });

    if (togglePostButton) {
        togglePostButton.addEventListener("click", () => {
            if (!token) {
                alert("Voce precisa estar logado para criar posts.");
                return;
            }

            if (!postComposerForm) {
                return;
            }

            if (postComposerForm.classList.contains("is-hidden")) {
                abrirComposer();
            } else {
                fecharComposer();
            }
        });
    }

    if (postContentInput && postCounter) {
        postContentInput.addEventListener("input", () => {
            postCounter.textContent = `${postContentInput.value.length}/${MAX_POST_LENGTH}`;
        });
    }

    if (cancelPostButton) {
        cancelPostButton.addEventListener("click", () => {
            fecharComposer();
        });
    }

    if (postComposerForm) {
        postComposerForm.addEventListener("submit", async event => {
            event.preventDefault();

            if (!token) {
                alert("Voce precisa estar logado para criar posts.");
                return;
            }

            const conteudo = (postContentInput?.value || "").trim();
            if (!conteudo) {
                alert("Escreva algo antes de publicar.");
                return;
            }

            if (sendPostButton) {
                sendPostButton.disabled = true;
                sendPostButton.classList.add("is-sending");
                sendPostButton.textContent = "Publicando...";
            }

            try {
                const response = await fetch(`${APP_BASE_URL}/posts`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ conteudo }),
                });

                if (response.status === 401) {
                    encerrarSessaoEIrLogin("Sua sessao expirou. Faca login novamente.");
                    return;
                }

                if (!response.ok) {
                    const detail = await extrairErro(response);
                    throw new Error(detail || "Nao foi possivel publicar seu post.");
                }

                const novoPost = await response.json();
                if (activeFeedTarget === "home") {
                    adicionarPostNoTopo({
                        ...novoPost,
                        username: novoPost.username || loggedUsername,
                        salvo: false,
                    });
                }
                fecharComposer();
            } catch (error) {
                console.error("Erro ao criar post:", error);
                alert(error.message || "Erro inesperado ao publicar post.");
            } finally {
                if (sendPostButton) {
                    sendPostButton.disabled = false;
                    sendPostButton.classList.remove("is-sending");
                    sendPostButton.textContent = "Publicar";
                }
            }
        });
    }

    carregarPosts();

    async function carregarPosts() {
        if (!feedScroll) {
            return;
        }

        feedScroll.innerHTML = "";
        feedScroll.appendChild(
            criarMensagemFeed(
                activeFeedTarget === "saved"
                    ? "Carregando seus posts salvos..."
                    : "Carregando posts...",
                "feed-loading"
            )
        );

        try {
            const endpoint = activeFeedTarget === "saved" ? "/posts/saved" : "/posts";
            const response = await fetch(`${APP_BASE_URL}${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                encerrarSessaoEIrLogin("Sua sessao expirou. Faca login novamente.");
                return;
            }

            if (!response.ok) {
                throw new Error("Nao foi possivel carregar o feed.");
            }

            const posts = await response.json();
            renderizarPosts(Array.isArray(posts) ? posts : []);
        } catch (error) {
            console.error("Erro ao carregar feed:", error);
            feedScroll.innerHTML = "";
            feedScroll.appendChild(
                criarMensagemFeed(
                    activeFeedTarget === "saved"
                        ? "Erro ao carregar posts salvos. Tente novamente em instantes."
                        : "Erro ao carregar posts. Tente novamente em instantes.",
                    "feed-empty"
                )
            );
        }
    }

    function renderizarPosts(posts) {
        if (!feedScroll) {
            return;
        }

        feedScroll.innerHTML = "";

        if (!posts.length) {
            feedScroll.appendChild(
                criarMensagemFeed(
                    activeFeedTarget === "saved"
                        ? "Nenhum post salvo ainda."
                        : "Nenhum post publicado ainda.",
                    "feed-empty"
                )
            );
            return;
        }

        posts.forEach((post, index) => {
            const card = criarCardPost(post, index);
            feedScroll.appendChild(card);
            configurarVotacao(card);
        });
    }

    function adicionarPostNoTopo(post) {
        if (!feedScroll) {
            return;
        }

        feedScroll.querySelectorAll(".feed-loading, .feed-empty").forEach(elemento => {
            elemento.remove();
        });

        const card = criarCardPost(post, 0);
        card.style.animationDelay = "0ms";

        if (feedScroll.firstElementChild) {
            feedScroll.insertBefore(card, feedScroll.firstElementChild);
        } else {
            feedScroll.appendChild(card);
        }

        configurarVotacao(card);
    }

    function abrirComposer() {
        if (!postComposerForm) {
            return;
        }

        postComposerForm.classList.remove("is-hidden");

        if (togglePostButton) {
            togglePostButton.textContent = "Fechar";
        }

        if (postContentInput) {
            postContentInput.focus();
        }
    }

    function fecharComposer() {
        if (!postComposerForm) {
            return;
        }

        postComposerForm.classList.add("is-hidden");

        if (postContentInput) {
            postContentInput.value = "";
        }

        if (postCounter) {
            postCounter.textContent = `0/${MAX_POST_LENGTH}`;
        }

        if (togglePostButton) {
            togglePostButton.textContent = "Postar";
        }
    }

    function criarCardPost(post, index) {
        const card = document.createElement("article");
        card.className = "post-card post-enter";
        card.dataset.postId = String(post.id);
        card.style.animationDelay = `${Math.min(index * 45, 260)}ms`;

        const header = document.createElement("header");
        header.className = "post-header";

        const userMeta = document.createElement("div");
        userMeta.className = "post-user-meta";

        const avatar = document.createElement("div");
        avatar.className = "post-user-avatar";

        const username = document.createElement("span");
        username.className = "post-user-name";
        username.textContent = `@${post.username || "usuario"}`;

        userMeta.appendChild(avatar);
        userMeta.appendChild(username);
        header.appendChild(userMeta);

        const headerActions = document.createElement("div");
        headerActions.className = "post-header-actions";

        const isOwner = loggedUserId > 0 && Number(post.usuario_id) === loggedUserId;

        const menuWrapper = document.createElement("div");
        menuWrapper.className = "post-menu-wrapper";

        const menuTrigger = document.createElement("button");
        menuTrigger.type = "button";
        menuTrigger.className = "post-menu-trigger";
        menuTrigger.setAttribute("aria-label", "Mais opcoes");
        menuTrigger.innerHTML = "&#8942;";

        const menuContent = document.createElement("div");
        menuContent.className = "post-menu-content";

        const reportAction = document.createElement("button");
        reportAction.type = "button";
        reportAction.className = "post-menu-item";
        reportAction.innerHTML = '<span class="menu-item-icon">!</span><span>Denunciar</span>';
        reportAction.addEventListener("click", () => {
            menuWrapper.classList.remove("open");
            alert("Funcionalidade de denuncia em breve.");
        });
        menuContent.appendChild(reportAction);

        if (isOwner) {
            const deleteAction = document.createElement("button");
            deleteAction.type = "button";
            deleteAction.className = "post-menu-item danger";
            deleteAction.innerHTML = '<span class="menu-item-icon">x</span><span>Excluir</span>';
            deleteAction.addEventListener("click", () => {
                menuWrapper.classList.remove("open");
                removerPost(post.id, card, deleteAction);
            });
            menuContent.appendChild(deleteAction);
        }

        menuTrigger.addEventListener("click", event => {
            event.stopPropagation();
            const shouldOpen = !menuWrapper.classList.contains("open");
            fecharMenusAbertos();
            if (shouldOpen) {
                menuWrapper.classList.add("open");
            }
        });

        menuContent.addEventListener("click", event => {
            event.stopPropagation();
        });

        menuWrapper.appendChild(menuTrigger);
        menuWrapper.appendChild(menuContent);
        headerActions.appendChild(menuWrapper);

        header.appendChild(headerActions);

        const contentBox = document.createElement("div");
        contentBox.className = "post-content-box";

        const contentText = document.createElement("p");
        contentText.className = "post-text";
        contentText.textContent = post.conteudo || "";
        contentBox.appendChild(contentText);

        const footer = document.createElement("footer");
        footer.className = "post-footer";

        const votes = document.createElement("div");
        votes.className = "post-votes";
        votes.innerHTML = [
            '<div class="vote-arrow upvote" aria-label="Upvote"></div>',
            '<span class="vote-count">0</span>',
            '<div class="vote-arrow downvote" aria-label="Downvote"></div>'
        ].join("");

        const socialActions = document.createElement("div");
        socialActions.className = "post-social-actions";

        const shareButton = document.createElement("button");
        shareButton.type = "button";
        shareButton.className = "post-action-btn share-action-btn";
        shareButton.setAttribute("aria-label", "Compartilhar post");
        shareButton.title = "Compartilhar";
        shareButton.innerHTML = "&#10548;";
        shareButton.addEventListener("click", () => {
            compartilharPost(post, shareButton);
        });

        const saveButton = document.createElement("button");
        saveButton.type = "button";
        saveButton.className = "post-action-btn save-flag-btn";
        saveButton.setAttribute("aria-label", "Salvar post");
        saveButton.title = post.salvo ? "Remover dos salvos" : "Salvar post";
        saveButton.setAttribute("aria-pressed", post.salvo ? "true" : "false");
        if (post.salvo) {
            saveButton.classList.add("is-saved");
        }
        saveButton.innerHTML = "&#9873;";
        saveButton.addEventListener("click", () => {
            alternarPostSalvo(post.id, saveButton, card);
        });

        socialActions.appendChild(shareButton);
        socialActions.appendChild(saveButton);

        footer.appendChild(votes);
        footer.appendChild(socialActions);

        card.appendChild(header);
        card.appendChild(contentBox);
        card.appendChild(footer);

        return card;
    }

    function configurarVotacao(postElement) {
        const upBtn = postElement.querySelector(".upvote");
        const downBtn = postElement.querySelector(".downvote");
        const countSpan = postElement.querySelector(".vote-count");

        if (!upBtn || !downBtn || !countSpan) {
            return;
        }

        const baseCount = parseInt(countSpan.textContent, 10) || 0;
        let userVote = 0;

        function triggerAnimation(elemento) {
            elemento.classList.remove("animating");
            void elemento.offsetWidth;
            elemento.classList.add("animating");
        }

        upBtn.addEventListener("click", () => {
            triggerAnimation(upBtn);
            if (userVote === 1) {
                userVote = 0;
                upBtn.classList.remove("upvoted");
            } else {
                userVote = 1;
                upBtn.classList.add("upvoted");
                downBtn.classList.remove("downvoted");
            }
            atualizarContador(countSpan, baseCount, userVote);
        });

        downBtn.addEventListener("click", () => {
            triggerAnimation(downBtn);
            if (userVote === -1) {
                userVote = 0;
                downBtn.classList.remove("downvoted");
            } else {
                userVote = -1;
                downBtn.classList.add("downvoted");
                upBtn.classList.remove("upvoted");
            }
            atualizarContador(countSpan, baseCount, userVote);
        });
    }

    function atualizarContador(elemento, base, voto) {
        elemento.textContent = base + voto;

        if (voto === 1) {
            elemento.style.color = "#ff4d4d";
        } else if (voto === -1) {
            elemento.style.color = "#7b2ff7";
        } else {
            elemento.style.color = "#ffffff";
        }
    }

    function criarMensagemFeed(mensagem, classe) {
        const elemento = document.createElement("p");
        elemento.className = classe;
        elemento.textContent = mensagem;
        return elemento;
    }

    async function removerPost(postId, postCard, deleteButton) {
        if (!token) {
            alert("Voce precisa estar logado para excluir posts.");
            return;
        }

        const confirmar = window.confirm(
            "Tem certeza que deseja excluir este post? Essa acao nao pode ser desfeita."
        );

        if (!confirmar) {
            return;
        }

        deleteButton.disabled = true;
        deleteButton.classList.add("is-loading");

        try {
            const response = await fetch(`${APP_BASE_URL}/posts/${postId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                encerrarSessaoEIrLogin("Sua sessao expirou. Faca login novamente.");
                return;
            }

            if (!response.ok) {
                const detail = await extrairErro(response);
                throw new Error(detail || "Nao foi possivel excluir este post.");
            }

            postCard.classList.add("is-removing");
            window.setTimeout(() => {
                postCard.remove();

                if (feedScroll && !feedScroll.querySelector(".post-card")) {
                    feedScroll.appendChild(
                        criarMensagemFeed(
                            activeFeedTarget === "saved"
                                ? "Nenhum post salvo ainda."
                                : "Nenhum post publicado ainda.",
                            "feed-empty"
                        )
                    );
                }
            }, 240);
        } catch (error) {
            console.error("Erro ao excluir post:", error);
            alert(error.message || "Erro inesperado ao excluir o post.");
            deleteButton.disabled = false;
            deleteButton.classList.remove("is-loading");
        }
    }

    async function extrairErro(response) {
        try {
            const data = await response.json();
            return data.detail || "";
        } catch {
            return "";
        }
    }

    async function alternarPostSalvo(postId, saveButton, postCard) {
        if (!token) {
            alert("Voce precisa estar logado para salvar posts.");
            return;
        }

        const estaSalvo = saveButton.classList.contains("is-saved");
        const method = estaSalvo ? "DELETE" : "POST";

        saveButton.disabled = true;
        saveButton.classList.add("is-loading");

        try {
            const response = await fetch(`${APP_BASE_URL}/posts/${postId}/save`, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                encerrarSessaoEIrLogin("Sua sessao expirou. Faca login novamente.");
                return;
            }

            if (!response.ok) {
                const detail = await extrairErro(response);
                throw new Error(detail || "Nao foi possivel atualizar seus salvos.");
            }

            const agoraSalvo = !estaSalvo;
            saveButton.classList.toggle("is-saved", agoraSalvo);
            saveButton.setAttribute("aria-pressed", agoraSalvo ? "true" : "false");
            saveButton.title = agoraSalvo ? "Remover dos salvos" : "Salvar post";

            if (activeFeedTarget === "saved" && !agoraSalvo) {
                postCard.classList.add("is-removing");
                window.setTimeout(() => {
                    postCard.remove();

                    if (feedScroll && !feedScroll.querySelector(".post-card")) {
                        feedScroll.appendChild(
                            criarMensagemFeed("Nenhum post salvo ainda.", "feed-empty")
                        );
                    }
                }, 240);
            }
        } catch (error) {
            console.error("Erro ao salvar/desfazer salvo:", error);
            alert(error.message || "Erro inesperado ao atualizar seus salvos.");
        } finally {
            saveButton.disabled = false;
            saveButton.classList.remove("is-loading");
        }
    }

    async function compartilharPost(post, shareButton) {
        const textoCompartilhamento = `@${post.username || "usuario"}: ${post.conteudo || ""}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: "Post do SocialBit",
                    text: textoCompartilhamento,
                });
                return;
            }

            await copiarTexto(textoCompartilhamento);
            shareButton.classList.add("is-shared");
            window.setTimeout(() => {
                shareButton.classList.remove("is-shared");
            }, 900);
        } catch (error) {
            if (error && error.name === "AbortError") {
                return;
            }

            console.error("Erro ao compartilhar:", error);
            alert("Nao foi possivel compartilhar este post agora.");
        }
    }

    async function copiarTexto(texto) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(texto);
            return;
        }

        const textarea = document.createElement("textarea");
        textarea.value = texto;
        textarea.setAttribute("readonly", "readonly");
        textarea.style.position = "fixed";
        textarea.style.top = "-1000px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
    }

    function fecharMenusAbertos() {
        document.querySelectorAll(".post-menu-wrapper.open").forEach(menu => {
            menu.classList.remove("open");
        });
    }

    async function validarSessao() {
        if (!token || !loggedUserId) {
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
                console.error("Falha ao validar sessao na Home.");
                return true;
            }

            const sessao = await response.json();
            if (sessao?.id) {
                localStorage.setItem("userId", String(sessao.id));
            }
            if (sessao?.username) {
                localStorage.setItem("username", sessao.username);
            }

            return true;
        } catch (error) {
            console.error("Erro ao validar sessao na Home:", error);
            return true;
        }
    }

    function encerrarSessaoEIrLogin(mensagem = "") {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");

        if (mensagem) {
            alert(mensagem);
        }

        window.location.href = LOGIN_PAGE_URL;
    }

    function configurarBuscaUsuarios() {
        if (!searchInput || !searchResults) {
            return;
        }

        searchInput.addEventListener("input", () => {
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

        searchInput.addEventListener("focus", () => {
            if (searchResults.children.length > 0) {
                searchResults.classList.add("is-visible");
            }
        });

        searchInput.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                ocultarResultadosBusca();
                searchInput.blur();
                return;
            }

            if (event.key === "Enter") {
                const primeiroResultado = searchResults.querySelector(".search-result-item");
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
                throw new Error("Falha ao buscar usuarios");
            }

            const usuarios = await response.json();
            renderizarResultadosBusca(Array.isArray(usuarios) ? usuarios : []);
        } catch (error) {
            console.error("Erro na busca de usuarios:", error);
            renderizarResultadosBusca([]);
        }
    }

    function renderizarResultadosBusca(usuarios) {
        if (!searchResults) {
            return;
        }

        searchResults.innerHTML = "";

        if (!usuarios.length) {
            const vazio = document.createElement("div");
            vazio.className = "search-result-empty";
            vazio.textContent = "Nenhum usuario encontrado.";
            searchResults.appendChild(vazio);
            searchResults.classList.add("is-visible");
            return;
        }

        usuarios.forEach(usuario => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "search-result-item";
            item.innerHTML = [
                `<span class="search-result-username">@${usuario.username || "usuario"}</span>`,
                `<span class="search-result-name">${(usuario.nome || "")} ${(usuario.sobrenome || "")}</span>`,
            ].join("");

            item.addEventListener("click", () => {
                window.location.href = `../perfil/perfil.html?id=${usuario.id}`;
            });

            searchResults.appendChild(item);
        });

        searchResults.classList.add("is-visible");
    }

    function ocultarResultadosBusca() {
        if (!searchResults) {
            return;
        }

        searchResults.classList.remove("is-visible");
        searchResults.innerHTML = "";
    }
});