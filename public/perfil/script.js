document.addEventListener('DOMContentLoaded', () => {
    // Seleção de elementos
    const body = document.getElementById('app-body');
    const btnToggle = document.getElementById('btn-toggle-edit');
    const avatarDisplay = document.getElementById('avatar-display');
    const profileUpload = document.getElementById('profile-upload');

    /**
     * Alterna entre Modo de Visualização e Modo de Edição
     */
    btnToggle.addEventListener('click', () => {
        // Alterna a classe no body que controla o CSS
        const isEditing = body.classList.toggle('editing-mode');
        
        // Atualiza o texto do botão conforme o estado
        if (isEditing) {
            btnToggle.textContent = "Salvar Alterações";
        } else {
            btnToggle.textContent = "Editar Perfil";
            // Aqui você pode adicionar a lógica de envio para o servidor/Firebase
            console.log("Dados salvos!");
        }
    });

    /**
     * Lógica para Alterar Imagem de Perfil
     */
    
    // Abre o seletor de arquivos ao clicar no círculo da foto
    avatarDisplay.addEventListener('click', () => {
        profileUpload.click();
    });

    // Detecta quando um arquivo é selecionado
    profileUpload.addEventListener('change', function() {
        const file = this.files[0];
        
        if (file) {
            // Verifica se é realmente uma imagem
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione um arquivo de imagem válido.');
                return;
            }

            const reader = new FileReader();
            
            // Quando a leitura do arquivo terminar
            reader.onload = function(e) {
                // Aplica a imagem como fundo (background-image)
                avatarDisplay.style.backgroundImage = `url(${e.target.result})`;
                
                // Opcional: Atualizar também o mini avatar do header
                const headerAvatar = document.querySelector('.header-user-avatar');
                if (headerAvatar) {
                    headerAvatar.style.backgroundImage = `url(${e.target.result})`;
                    headerAvatar.style.backgroundSize = 'cover';
                }
            }
            
            reader.readAsDataURL(file);
        }
    });
});