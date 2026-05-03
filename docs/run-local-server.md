# 로컬 서버 실행 가이드

## 1. 가장 빠르게 실행

```bash
cd /Users/gangjingu/project/Quit-codex

cat > .env.local <<'EOF'
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

npm install
npm run dev
```

```text
브라우저에서 열기
http://localhost:3000
```

## 2. DB까지 같이 실행

```bash
cd /Users/gangjingu/project/Quit-codex

cp .env.example .env.local

npm install
docker compose up -d
npx prisma migrate deploy
npm run import:master-data
npm run dev
```

```text
브라우저에서 열기
http://localhost:3000
```

```text
관리자 열기
http://localhost:3000/admin
```

```text
로컬 관리자 계정
email: admin@local.dev
password: admin1234!
```

## 3. 종료

```bash
Ctrl + C
```

```bash
cd /Users/gangjingu/project/Quit-codex
docker compose down
```
