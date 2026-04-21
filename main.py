from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from typing import List, Optional

# --- 1. CONFIGURAÇÃO DO BANCO DE DADOS ---
# Utilizando suas credenciais padrão
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:1234@localhost/socialbit"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. MODELOS DO BANCO (USUÁRIOS E POSTS) ---

class Usuario(Base):
    __tablename__ = "Usuario"
    ID = Column(Integer, primary_key=True, index=True)
    username = Column(String(25), unique=True)
    dtNasc = Column(String(10)) 
    email = Column(String(100), unique=True)
    senha = Column(String(25))
    nome = Column(String(50))
    sobrenome = Column(String(50))
    telefone = Column(String(20))
    bio = Column(Text, nullable=True)
    foto_url = Column(Text, nullable=True) # Para salvar Base64
    
    # Relacionamento: Um usuário tem muitos posts
    posts = relationship("Post", back_populates="autor")

class Post(Base):
    __tablename__ = "Post"
    ID = Column(Integer, primary_key=True, index=True)
    conteudo = Column(Text)
    votos = Column(Integer, default=0)
    usuario_id = Column(Integer, ForeignKey("Usuario.ID"))
    
    # Relacionamento: Cada post pertence a um usuário
    autor = relationship("Usuario", back_populates="posts")

# Garante que todas as tabelas e colunas novas existam
Base.metadata.create_all(bind=engine)

# --- 3. ESQUEMAS DE VALIDAÇÃO (PYDANTIC) ---

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
    telefone: str
    dtNasc: str
    foto_url: Optional[str] = None

class PostCreate(BaseModel):
    usuario_id: int
    conteudo: str

# --- 4. INICIALIZAÇÃO E MIDDLEWARES ---

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montagem da pasta de arquivos estáticos
app.mount("/public", StaticFiles(directory="public"), name="public")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 5. ROTAS DE AUTENTICAÇÃO ---

@app.get("/")
async def root():
    return {"message": "SocialBit API Online. Acesse /public/Login/login.html"}

@app.post("/login")
async def login(dados: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == dados.email).first()
    if not usuario or usuario.senha != dados.senha:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    return {"message": "Sucesso", "id": usuario.ID, "username": usuario.username}

@app.post("/usuarios")
async def cadastrar_usuario(usuario: CadastroUsuario, db: Session = Depends(get_db)):
    db_user = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    novo_usuario = Usuario(
        username=usuario.username, dtNasc=usuario.dtNasc, senha=usuario.senha,
        email=usuario.email, nome=usuario.nome, sobrenome=usuario.sobrenome,
        telefone=usuario.telefone, bio="", foto_url=""
    )
    db.add(novo_usuario)
    db.commit()
    return {"message": "Usuário cadastrado com sucesso"}

# --- 6. ROTAS DE PERFIL E BUSCA ---

@app.get("/usuarios/busca")
async def buscar_usuarios(username: str, db: Session = Depends(get_db)):
    termo = username.strip()
    if not termo: return []
    usuarios = db.query(Usuario).filter(Usuario.username.like(f"%{termo}%")).limit(10).all()
    return [{"id": u.ID, "username": u.username, "nome": u.nome, "sobrenome": u.sobrenome} for u in usuarios]

@app.get("/usuarios/{user_id}")
async def obter_perfil(user_id: str, db: Session = Depends(get_db)):
    # Tratamento para evitar erro quando o localStorage retorna "null" no JS
    if user_id in ["null", "undefined", ""]:
        raise HTTPException(status_code=400, detail="ID de usuário inválido")
    
    usuario = db.query(Usuario).filter(Usuario.ID == int(user_id)).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return {
        "id": usuario.ID, "username": usuario.username, "nome": usuario.nome,
        "sobrenome": usuario.sobrenome, "bio": usuario.bio or "",
        "telefone": usuario.telefone or "", "dtNasc": usuario.dtNasc or "",
        "foto_url": usuario.foto_url or ""
    }

@app.put("/usuarios/update")
async def atualizar_perfil(dados: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(Usuario).filter(Usuario.ID == dados.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    db_user.nome = dados.nome
    db_user.sobrenome = dados.sobrenome
    db_user.bio = dados.bio
    db_user.telefone = dados.telefone
    db_user.dtNasc = dados.dtNasc
    if dados.foto_url:
        db_user.foto_url = dados.foto_url
    
    db.commit()
    return {"message": "Perfil atualizado com sucesso"}

# --- 7. ROTAS DE POSTS E VOTOS ---

@app.get("/posts")
async def listar_posts(db: Session = Depends(get_db)):
    posts = db.query(Post).all()
    return [{
        "id": p.ID, "conteudo": p.conteudo, "votos": p.votos,
        "autor": p.autor.username, "autor_id": p.autor.ID
    } for p in posts]

@app.post("/posts/criar")
async def criar_post(dados: PostCreate, db: Session = Depends(get_db)):
    novo_post = Post(conteudo=dados.conteudo, usuario_id=dados.usuario_id)
    db.add(novo_post)
    db.commit()
    return {"message": "Post criado com sucesso"}

@app.put("/posts/{post_id}/votar")
async def votar(post_id: int, tipo: str, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.ID == post_id).first()
    if not post: raise HTTPException(status_code=404)
    if tipo == "up": post.votos += 1
    elif tipo == "down": post.votos -= 1
    db.commit()
    return {"votos": post.votos}