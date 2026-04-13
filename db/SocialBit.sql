

/* Lógico_1: */

CREATE TABLE Usuario (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    username varchar(25),
    dtNasc date,
    senha varchar(25),
    email varchar(100),
    nome varchar(25),
    sobrenome varchar(50),
    telefone varchar(15)
);

CREATE TABLE Post (
    ID INT PRIMARY KEY,
    texto VARCHAR(500),
    midia BLOB,
    voto INT,
    fk_Tipo_ID INT
);

CREATE TABLE Tipo (
    ID INT PRIMARY KEY,
    comentario INT,
    post INT
);

CREATE TABLE Post_Ususario (
    fk_Usuario_ID INT,
    fk_Post_ID INT
);

CREATE TABLE Votacao (
	ID INT PRIMARY KEY,
    Tipo ENUM('post', 'comentario'),
    fk_Post_ID INT,
    fk_Usuario_ID INT
    
);
 
ALTER TABLE Post ADD CONSTRAINT FK_Post_2
    FOREIGN KEY (fk_Tipo_ID)
    REFERENCES Tipo (ID)
    ON DELETE SET NULL;
 
ALTER TABLE Post_Ususario ADD CONSTRAINT FK_Post_Ususario_1
    FOREIGN KEY (fk_Usuario_ID)
    REFERENCES Usuario (ID)
    ON DELETE SET NULL;
 
ALTER TABLE Post_Ususario ADD CONSTRAINT FK_Post_Ususario_2
    FOREIGN KEY (fk_Post_ID)
    REFERENCES Post (ID)
    ON DELETE SET NULL;
 
ALTER TABLE Votacao ADD CONSTRAINT FK_Votacao_2
    FOREIGN KEY (fk_Post_ID)
    REFERENCES Post (ID)
    ON DELETE SET NULL;
 
ALTER TABLE Votacao ADD CONSTRAINT FK_Votacao_3
    FOREIGN KEY (fk_Usuario_ID)
    REFERENCES Usuario (ID)
    ON DELETE SET NULL;
    

INSERT INTO Usuario (ID, email, senha, username, nome) 
VALUES (1, 'teste@gmail.com', '123456cuCU@!', 'testador', 'Larissa');


USE socialbit;
SELECT * FROM Usuario;
SELECT * FROM socialbit.Usuario;