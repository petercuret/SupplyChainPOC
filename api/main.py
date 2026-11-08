import config.django  # noqa: F401, I001  (must run before anything touches the ORM)

from django.conf import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from routers import catalog, incidents, parts

app = FastAPI(title="Supply Chain POC API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(catalog.router)
app.include_router(incidents.router)
app.include_router(parts.router)


class HelloResponse(BaseModel):
    message: str


@app.get("/api/hello")
def hello() -> HelloResponse:
    return HelloResponse(message="Hello, World!")
