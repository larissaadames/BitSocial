from fastapi import FastAPI
from mangum import Mangum
from starlette.staticfiles import StaticFiles
app = FastAPI()
app.mount("public", StaticFiles(directory="public/Login", html=True), name="static")

@app.get("/")


def hello() -> str:

    return "Hello World"


handler = Mangum(app)