from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer
import secrets
import hashlib
from urllib.parse import quote_plus


# 1. Configuração do Banco de Dados
senha_secreta = quote_plus("PUC@1234")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://root:{senha_secreta}@localhost/socialbit"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Modelo do Banco (Tabela)
class Usuario(Base):
    __tablename__ = "Usuario"
    ID = Column(Integer, primary_key=True, index=True)
    username = Column(String(25))
    dtNasc = Column(String(10)) 
    email = Column(String(100), unique=True)
    senha = Column(String(100))
    nome = Column(String(50))
    sobrenome = Column(String(50))
    telefone = Column(String(20))

# 3. Esquemas de Validação (Pydantic) - DEVEM VIR ANTES DAS ROTAS
class LoginRequest(BaseModel):
    email: str
    senha: str

class CadastroUsuario(BaseModel):
    username: str
    dtNasc: str
    senha: str
    email: str
    nome: str
    sobrenome: str
    telefone: str

# 4. Inicialização do App
app = FastAPI()
app.mount("/public", StaticFiles(directory="public"), name="public")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 5. Rotas
@app.get("/")
async def root():
    return {"message": "API BitSocial Online. Acesse /public/Login/login.html"}

@app.post("/login")
async def login(dados: LoginRequest, db: Session = Depends(get_db)):
    print("\nNOVA TENTATIVA DE LOGIN")
    print(f"1. Email digitado no site: '{dados.email}'")
    print(f"2. Senha digitada no site: '{dados.senha}'")
    
    usuario = db.query(Usuario).filter(Usuario.email == dados.email).first()
    
    if not usuario:
        print("❌ Email não existe no banco de dados!")
        raise HTTPException(status_code=401, detail="E-mail não encontrado")
        
    print(f"3. Usuário encontrado no banco: {usuario.nome} (ID: {usuario.ID})")
    print(f"4. Hash salvo no banco: '{usuario.senha}'")
    
    hash_da_tentativa = get_password_hash(dados.senha)
    print(f"5. Hash gerado agora para comparar: '{hash_da_tentativa}'")

    if not verify_password(dados.senha, usuario.senha):
        print("❌ As senhas/hashes não batem!")
        raise HTTPException(status_code=401, detail="Senha incorreta")
        
    print("✅ LOGIN APROVADO!")
    return {"message": "Sucesso", "username": usuario.username, "token": "seu_token_temporario_aqui"}

@app.post("/usuarios")
async def cadastrar_usuario(usuario: CadastroUsuario, db: Session = Depends(get_db)):
    db_user = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    senha_criptografada = get_password_hash(usuario.senha)

    novo_usuario = Usuario(
        username=usuario.username,
        dtNasc=usuario.dtNasc,
        senha=senha_criptografada,
        email=usuario.email,
        nome=usuario.nome,
        sobrenome=usuario.sobrenome,
        telefone=usuario.telefone
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return {"message": "Usuário cadastrado com sucesso"}

@app.get("/usuarios/busca")
async def buscar_usuarios(username: str, db: Session = Depends(get_db)):
    termo = username.strip()

    if not termo:
        return []

    usuarios = (
        db.query(Usuario)
        .filter(Usuario.username.like(f"%{termo}%"))
        .order_by(Usuario.username.asc())
        .limit(10)
        .all()
    )

    return [
        {
            "id": usuario.ID,
            "username": usuario.username,
            "nome": usuario.nome,
            "sobrenome": usuario.sobrenome,
        }
        for usuario in usuarios
    ]
# 6. 

# No login
def criar_token(db, usuario_id):
    token = secrets.token_hex(32)
    # salva token + usuario_id no banco
    return token

# Validação
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
def get_current_user(token: str = Depends(oauth2_scheme)):
    usuario = db.query(Usuario).filter(Usuario.token == token).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Não autorizado")
    return usuario


# hash

def get_password_hash(password: str):

    hash_objeto = hashlib.sha256(password.encode('utf-8'))
    
    return hash_objeto.hexdigest()

def verify_password(plain_password: str, hashed_password: str):
    hash_da_senha_digitada = get_password_hash(plain_password)
    return hash_da_senha_digitada == hashed_password