document.addEventListener('DOMContentLoaded', () => {
    const body = document.getElementById('app-body');
    const btnAction = document.getElementById('btn-action');
    const btnShowPassword = document.getElementById('btn-show-password');
    const passwordFields = document.getElementById('password-fields');
    const avatarDisplay = document.getElementById('avatar-display');
    const profileUpload = document.getElementById('profile-upload');

    // Validação de Senha (Regras do Cadastro)
    const validarSenha = (senha) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(senha);
    };

    /**
     * Alternância entre Visualização e Edição
     */
    btnAction.addEventListener('click', () => {
        if (body.classList.contains('editing-mode')) {
            handleSave();
        } else {
            body.classList.add('editing-mode');
            btnAction.textContent = "Salvar Alterações";
        }
    });

    /**
     * Controle da Seção de Senha
     */
    btnShowPassword.addEventListener('click', () => {
        const isOpen = passwordFields.classList.toggle('show');
        btnShowPassword.textContent = isOpen ? "Cancelar Alteração" : "Alterar Senha";
    });

    function handleSave() {
        const newPass = document.getElementById('new-pass').value;
        const confirmPass = document.getElementById('confirm-new-pass').value;

        // Validação se o campo de senha estiver aberto
        if (passwordFields.classList.contains('show') && newPass !== "") {
            if (!validarSenha(newPass)) {
                alert("A nova senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, um número e um símbolo.");
                return;
            }
            if (newPass !== confirmPass) {
                alert("As novas senhas não coincidem!");
                return;
            }
        }

        alert("Perfil atualizado com sucesso!");
        body.classList.remove('editing-mode');
        btnAction.textContent = "Editar Perfil";
        passwordFields.classList.remove('show');
    }

    /**
     * Lógica de Foto de Perfil
     */
    avatarDisplay.addEventListener('click', () => profileUpload.click());
    profileUpload.addEventListener('change', function() {
        const file = this.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarDisplay.style.backgroundImage = `url(${e.target.result})`;
                const headerAvatar = document.getElementById('header-avatar');
                if (headerAvatar) headerAvatar.style.backgroundImage = `url(${e.target.result})`;
            };
            reader.readAsDataURL(file);
        }
    });
});