document.addEventListener('DOMContentLoaded', () => {
    const avatarDisplay = document.getElementById('avatar-display');
    const profileUpload = document.getElementById('profile-upload');

    // 1. Aciona o seletor de arquivos ao clicar no círculo
    avatarDisplay.addEventListener('click', () => {
        profileUpload.click();
    });

    // 2. Processa a imagem selecionada e atualiza a interface
    profileUpload.addEventListener('change', function() {
        const file = this.files[0];
        
        if (file) {
            // Validação simples de tipo
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione um arquivo de imagem.');
                return;
            }

            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Aplica a imagem como fundo do círculo
                avatarDisplay.style.backgroundImage = `url(${e.target.result})`;
                // Opcional: esconder o texto de overlay após a primeira troca
                // avatarDisplay.querySelector('.avatar-overlay').textContent = "Trocar Foto";
            }
            
            reader.readAsDataURL(file);
        }
    });
});