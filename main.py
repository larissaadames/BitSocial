from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, func, and_, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import jwt, JWTError
import hashlib

# 1. Configuração do Banco de Dados
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:root@localhost/socialbit"
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
    senha = Column(String(100))
    nome = Column(String(50))
    sobrenome = Column(String(50))
    telefone = Column(String(20))
    bio = Column(Text, nullable=True)


class Post(Base):
    __tablename__ = "Post"
    ID = Column(Integer, primary_key=True, index=True)
    conteudo = Column("texto", Text, nullable=False)


class PostUsuario(Base):
    __tablename__ = "Post_Ususario"
    usuario_id = Column("fk_Usuario_ID", Integer, ForeignKey("Usuario.ID"), primary_key=True)
    post_id = Column("fk_Post_ID", Integer, ForeignKey("Post.ID"), primary_key=True)


class PostSalvo(Base):
    __tablename__ = "PostSalvo"
    usuario_id = Column("fk_Usuario_ID", Integer, ForeignKey("Usuario.ID"), primary_key=True)
    post_id = Column("fk_Post_ID", Integer, ForeignKey("Post.ID"), primary_key=True)


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


class PostCreate(BaseModel):
    conteudo: str


class PostUpdate(BaseModel):
    conteudo: str


# 4. Inicialização do App
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/public", StaticFiles(directory="public"), name="public")

# Cria apenas a tabela de salvos quando ainda não existir.
PostSalvo.__table__.create(bind=engine, checkfirst=True)


def ensure_schema_compatibility():
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE Usuario MODIFY COLUMN senha VARCHAR(100)"))
    except Exception as error:
        # Se a tabela/coluna ainda nao existir em algum setup, mantemos o app de pe.
        print(f"Aviso: nao foi possivel ajustar schema de senha: {error}")


ensure_schema_compatibility()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# JWT/Auth
SECRET_KEY = "troque-esta-chave"
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 24


def create_access_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def is_probably_hash(stored_password: str) -> bool:
    if not stored_password or len(stored_password) != 64:
        return False
    return all(char in "0123456789abcdef" for char in stored_password.lower())


def verify_password(plain_password: str, stored_password: str) -> bool:
    if is_probably_hash(stored_password):
        return get_password_hash(plain_password) == stored_password
    return plain_password == stored_password


def get_current_user_id(authorization: str = Header(default=None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token ausente")

    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Token inválido")


# 5. Rotas
@app.get("/")
async def root():
    return {"message": "API Online. Acesse /public/Login/login.html"}


@app.get("/auth/me")
async def obter_sessao_atual(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    usuario = db.query(Usuario).filter(Usuario.ID == user_id).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Sessao invalida")

    return {"id": usuario.ID, "username": usuario.username}


@app.post("/login")
async def login(dados: LoginRequest, db: Session = Depends(get_db)):
    print("\nNOVA TENTATIVA DE LOGIN")
    print(f"1. Email digitado no site: '{dados.email}'")
    print(f"2. Senha digitada no site: '{dados.senha}'")
    
    usuario = db.query(Usuario).filter(Usuario.email == dados.email).first()
    if not usuario or not verify_password(dados.senha, usuario.senha):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

    # Migra silenciosamente usuarios antigos que ainda possuem senha em texto puro.
    if not is_probably_hash(usuario.senha):
        usuario.senha = get_password_hash(dados.senha)
        db.commit()

    token = create_access_token(usuario.ID)
    return {
        "message": "Sucesso",
        "id": usuario.ID,
        "username": usuario.username,
        "access_token": token,
        "token_type": "bearer",
    }


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
        telefone=usuario.telefone,
        bio="",
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
        {"id": u.ID, "username": u.username, "nome": u.nome, "sobrenome": u.sobrenome}
        for u in usuarios
    ]


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
        "bio": usuario.bio or "",
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


@app.get("/usuarios/{user_id}/posts")
async def listar_posts_usuario(
    user_id: int,
    viewer_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    usuario = db.query(Usuario).filter(Usuario.ID == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    posts = (
        db.query(
            Post.ID,
            Post.conteudo,
            PostUsuario.usuario_id,
            Usuario.username,
            PostSalvo.post_id.label("salvo_post_id"),
        )
        .join(PostUsuario, PostUsuario.post_id == Post.ID)
        .join(Usuario, Usuario.ID == PostUsuario.usuario_id)
        .outerjoin(
            PostSalvo,
            and_(
                PostSalvo.post_id == Post.ID,
                PostSalvo.usuario_id == viewer_id,
            ),
        )
        .filter(PostUsuario.usuario_id == user_id)
        .order_by(Post.ID.desc())
        .all()
    )

    return [
        {
            "id": post.ID,
            "conteudo": post.conteudo,
            "usuario_id": post.usuario_id,
            "username": post.username,
            "salvo": post.salvo_post_id is not None,
        }
        for post in posts
    ]


@app.get("/posts")
async def listar_posts(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    posts = (
        db.query(
            Post.ID,
            Post.conteudo,
            PostUsuario.usuario_id,
            Usuario.username,
            PostSalvo.post_id.label("salvo_post_id"),
        )
        .join(PostUsuario, PostUsuario.post_id == Post.ID)
        .join(Usuario, Usuario.ID == PostUsuario.usuario_id)
        .outerjoin(
            PostSalvo,
            and_(
                PostSalvo.post_id == Post.ID,
                PostSalvo.usuario_id == user_id,
            ),
        )
        .order_by(Post.ID.desc())
        .all()
    )

    return [
        {
            "id": post.ID,
            "conteudo": post.conteudo,
            "usuario_id": post.usuario_id,
            "username": post.username,
            "salvo": post.salvo_post_id is not None,
        }
        for post in posts
    ]


@app.get("/posts/saved")
async def listar_posts_salvos(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    posts = (
        db.query(
            Post.ID,
            Post.conteudo,
            PostUsuario.usuario_id,
            Usuario.username,
        )
        .join(PostSalvo, and_(PostSalvo.post_id == Post.ID, PostSalvo.usuario_id == user_id))
        .join(PostUsuario, PostUsuario.post_id == Post.ID)
        .join(Usuario, Usuario.ID == PostUsuario.usuario_id)
        .order_by(Post.ID.desc())
        .all()
    )

    return [
        {
            "id": post.ID,
            "conteudo": post.conteudo,
            "usuario_id": post.usuario_id,
            "username": post.username,
            "salvo": True,
        }
        for post in posts
    ]


@app.post("/posts/{post_id}/save")
async def salvar_post(
    post_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.ID == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post não encontrado")

    ja_salvo = (
        db.query(PostSalvo)
        .filter(PostSalvo.post_id == post_id, PostSalvo.usuario_id == user_id)
        .first()
    )
    if ja_salvo:
        return {"message": "Post já está salvo"}

    salvo = PostSalvo(usuario_id=user_id, post_id=post_id)
    db.add(salvo)
    db.commit()
    return {"message": "Post salvo com sucesso"}


@app.delete("/posts/{post_id}/save")
async def remover_post_salvo(
    post_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.ID == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post não encontrado")

    salvo = (
        db.query(PostSalvo)
        .filter(PostSalvo.post_id == post_id, PostSalvo.usuario_id == user_id)
        .first()
    )
    if not salvo:
        return {"message": "Post não estava salvo"}

    db.delete(salvo)
    db.commit()
    return {"message": "Post removido dos salvos"}


@app.post("/posts")
async def criar_post(
    dados: PostCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    conteudo_limpo = dados.conteudo.strip()
    if not conteudo_limpo:
        raise HTTPException(status_code=400, detail="Conteudo do post nao pode ser vazio")

    ultimo_id = db.query(func.max(Post.ID)).scalar() or 0
    novo_post_id = int(ultimo_id) + 1

    post = Post(ID=novo_post_id, conteudo=conteudo_limpo)
    db.add(post)
    db.flush()

    relacionamento = PostUsuario(usuario_id=user_id, post_id=novo_post_id)
    db.add(relacionamento)
    db.commit()
    db.refresh(post)

    usuario = db.query(Usuario).filter(Usuario.ID == user_id).first()

    return {
        "id": novo_post_id,
        "conteudo": post.conteudo,
        "usuario_id": user_id,
        "username": usuario.username if usuario else "usuario",
    }


@app.put("/posts/{post_id}")
async def editar_post(
    post_id: int,
    dados: PostUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.ID == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post não encontrado")

    relacionamento = db.query(PostUsuario).filter(PostUsuario.post_id == post_id).first()
    if not relacionamento:
        raise HTTPException(status_code=404, detail="Autor do post não encontrado")

    if relacionamento.usuario_id != user_id:
        raise HTTPException(status_code=403, detail="Sem permissão para editar este post")

    conteudo_limpo = dados.conteudo.strip()
    if not conteudo_limpo:
        raise HTTPException(status_code=400, detail="Conteudo do post nao pode ser vazio")

    post.conteudo = conteudo_limpo
    db.commit()
    return {"message": "Post atualizado com sucesso"}


@app.delete("/posts/{post_id}")
async def remover_post(
    post_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.ID == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post não encontrado")

    relacionamento = db.query(PostUsuario).filter(PostUsuario.post_id == post_id).first()
    if not relacionamento:
        raise HTTPException(status_code=404, detail="Autor do post não encontrado")

    if relacionamento.usuario_id != user_id:
        raise HTTPException(status_code=403, detail="Sem permissão para remover este post")

    db.query(PostSalvo).filter(PostSalvo.post_id == post_id).delete(
        synchronize_session=False
    )
    db.query(PostUsuario).filter(PostUsuario.post_id == post_id).delete(
        synchronize_session=False
    )
    db.delete(post)
    db.commit()
    return {"message": "Post removido com sucesso"}