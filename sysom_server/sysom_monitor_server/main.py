from fastapi import FastAPI
from app.routeres import home

app = FastAPI()

app.include_router(home.router, prefix="/api/v1/monitor/home")


@app.on_event("startup")
async def on_start():
    pass


@app.on_event("shutdown")
async def on_shutdown():
    pass
