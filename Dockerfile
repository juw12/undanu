FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    DATA_DIR=/data \
    PORT=8000

WORKDIR /app
COPY server.py demos.py ./
COPY public ./public
COPY seed ./seed

# Runs as root so platform-mounted volumes (Render/Railway/Fly) are writable without extra setup.
VOLUME ["/data"]
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request,os; urllib.request.urlopen('http://127.0.0.1:%s/healthz' % os.environ.get('PORT','8000'))"

CMD ["python", "server.py"]
