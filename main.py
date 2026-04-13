from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel

# 1. Configuração do Banco de Dados (MySQL)
# Substitua 'usuario' e 'senha' pelos seus dados do MySQL Local
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:1234@localhost/socialbit"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Modelo da Tabela Usuario (Baseado no seu SocialBit.sql)
class Usuario(Base):
    __tablename__ = "Usuario"
    ID = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True)
    senha = Column(String(25))
    username = Column(String(25))

# 3. Esquema para validação dos dados que vêm do Front-end
class LoginRequest(BaseModel):
    email: str
    senha: str

# 4. Inicialização do App
app = FastAPI()

# Monta a pasta public para servir o HTML, CSS e JS
app.mount("/public", StaticFiles(directory="public"), name="public")

# Dependência para o banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 5. Rota de Login
@app.post("/login")
async def login(dados: LoginRequest, db: Session = Depends(get_db)):
    # Busca o usuário no banco de dados pelo e-mail
    usuario = db.query(Usuario).filter(Usuario.email == dados.email).first()

    # Verifica se o usuário existe e se a senha está correta
    if not usuario or usuario.senha != dados.senha:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos"
        )

    return {"message": "Sucesso", "username": usuario.username}

# Rota auxiliar para redirecionar ou testar
@app.get("/")
async def root():
    return {"message": "API BitSocial Online. Acesse /public/Login/login.html"}