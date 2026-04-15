import pymysql

# Configuração do banco de dados
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "PUC@1234",
    "database": "SocialBit"
}
# Função para obter conexão com MySQL
def get_db():
    return pymysql.connect(**DB_CONFIG)