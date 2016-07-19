
FROM diko316/alnode

COPY . $PROJECT_ROOT

RUN npm install -dd -y
