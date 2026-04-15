document.addEventListener('DOMContentLoaded', () => {
    const body = document.getElementById('app-body');
    const btnAction = document.getElementById('btn-action');
    const avatarDisplay = document.getElementById('avatar-display');
    const profileUpload = document.getElementById('profile-upload');
    const headerAvatar = document.getElementById('header-avatar');

    /**
     * Controle do Botão Principal (Editar / Salvar)
     */
    btnAction.addEventListener('click', () => {
        const isCurrentlyEditing = body.classList.contains('editing-mode');

        if (isCurrentlyEditing) {
            // LÓGICA DE SALVAR
            saveProfile();
        } else {
            // LÓGICA DE ENTRAR NA EDIÇÃO
            enterEditMode();
        }
    });

    function enterEditMode() {
        body.classList.add('editing-mode');
        btnAction.textContent = "Salvar Alterações";
    }

    function saveProfile() {
        // 1. Simulação de processamento de dados
        console.log("Salvando informações no banco de dados...");

        // 2. Feedback ao usuário
        alert("Alterações salvas com sucesso!");

        // 3. O PASSO QUE VOCÊ PEDIU: Voltar para o modo de visualização
        body.classList.remove('editing-mode');
        btnAction.textContent = "Editar Perfil";
    }

    /**
     * Lógica de Troca de Foto
     */
    avatarDisplay.addEventListener('click', () => {
        profileUpload.click();
    });

    profileUpload.addEventListener('change', function() {
        const file = this.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = `url(${e.target.result})`;
                avatarDisplay.style.backgroundImage = imageUrl;
                if (headerAvatar) {
                    headerAvatar.style.backgroundImage = imageUrl;
                }
            };
            reader.readAsDataURL(file);
        }
    });
});