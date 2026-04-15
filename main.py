from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer
import secrets

# 1. Configuração do Banco de Dados
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:1234@localhost/socialbit"
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
    senha = Column(String(25))
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
    usuario = db.query(Usuario).filter(Usuario.email == dados.email).first()
    if not usuario or usuario.senha != dados.senha:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    return {"message": "Sucesso", "username": usuario.username}

@app.post("/usuarios")
async def cadastrar_usuario(usuario: CadastroUsuario, db: Session = Depends(get_db)):
    db_user = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    novo_usuario = Usuario(
        username=usuario.username,
        dtNasc=usuario.dtNasc,
        senha=usuario.senha,
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
