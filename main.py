from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware # IMPORTADO
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import Optional

# 1. Configuração do Banco de Dados
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:1234@localhost/socialbit"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Modelo do Banco
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
    bio = Column(Text, nullable=True)

# 3. Esquemas de Validação
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

class UserUpdate(BaseModel):
    id: int
    nome: str
    sobrenome: str
    bio: str

# 4. Inicialização do App
app = FastAPI()

# --- CONFIGURAÇÃO DE CORS (ADICIONADA) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite qualquer origem (ideal para desenvolvimento)
    allow_credentials=True,
    allow_methods=["*"], # Permite todos os métodos (GET, POST, PUT, etc)
    allow_headers=["*"],
)

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
    return {"message": "API Online. Acesse /public/Login/login.html"}

@app.post("/login")
async def login(dados: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == dados.email).first()
    if not usuario or usuario.senha != dados.senha:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    return {
        "message": "Sucesso", 
        "id": usuario.ID, 
        "username": usuario.username
    }

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
        telefone=usuario.telefone,
        bio=""
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return {"message": "Usuário cadastrado com sucesso"}

@app.get("/usuarios/{user_id}")
async def obter_perfil(user_id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.ID == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return {
        "id": usuario.ID,
        "username": usuario.username,
        "nome": usuario.nome,
        "sobrenome": usuario.sobrenome,
        "bio": usuario.bio or ""
    }

@app.put("/usuarios/update")
async def atualizar_perfil(dados: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(Usuario).filter(Usuario.ID == dados.id).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    db_user.nome = dados.nome
    db_user.sobrenome = dados.sobrenome
    db_user.bio = dados.bio
    
    db.commit()
    db.refresh(db_user)
    return {"message": "Perfil atualizado com sucesso"}

@app.get("/usuarios/busca")
async def buscar_usuarios(username: str, db: Session = Depends(get_db)):
    termo = username.strip()
    if not termo: return []

    usuarios = (
        db.query(Usuario)
        .filter(Usuario.username.like(f"%{termo}%"))
        .order_by(Usuario.username.asc())
        .limit(10).all()
    )

    return [
        {"id": u.ID, "username": u.username, "nome": u.nome, "sobrenome": u.sobrenome}
        for u in usuarios
    ]