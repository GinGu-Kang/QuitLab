# Phase 3: 데이터베이스 + 외부 서비스 연동

> **사전 조건**: Phase 2 완료 (매칭 알고리즘, API)
> **산출물**: Prisma 스키마, DB 연결, 암호화 유틸, API에 DB 저장 연결
> **예상 파일 수**: ~10-12개

---

## ⚠️ 사용자 액션 필요 (이 Phase 시작 전)

1. **Supabase 프로젝트 생성**: https://supabase.com → New Project → Seoul 리전
2. **`.env.local` 파일 생성** (`.env.example` 복사 후 아래 값 채우기):
   ```env
   DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
   SUPABASE_SERVICE_ROLE_KEY=[service role key]
   ```
3. **암호화 키 생성**:
   ```bash
   openssl rand -hex 32
   ```
   → `.env.local`에 `ENCRYPTION_KEY=[결과값]` 추가

---

## 3-1. Prisma 스키마

### 파일: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model UserResult {
  id              String   @id @default(cuid())
  sessionId       String   @unique
  createdAt       DateTime @default(now())

  hardFilterInputs    Json
  competencyScores    Json   // number[] (12개)
  personalityAnswers  Json   // ('a'|'b')[] (10개)
  top5Results         Json   // MatchResult[] (5개)
  comicImageUrl       String?

  userAgent       String?
  ipHash          String?

  userContact     UserContact?
}

model UserContact {
  id                    String    @id @default(cuid())
  userResultId          String    @unique
  userResult            UserResult @relation(fields: [userResultId], references: [id], onDelete: Cascade)

  name                  String
  email                 String
  phoneEncrypted        String    // AES-256-GCM
  phoneHash             String    // 중복 체크용

  privacyConsent        Boolean   @default(false)
  privacyConsentAt      DateTime?
  marketingConsent      Boolean   @default(false)
  marketingConsentAt    DateTime?
  consentIpHash         String?
  consentUserAgent      String?

  unsubscribedAt        DateTime?
  unsubscribeToken      String    @unique @default(cuid())

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([email])
  @@index([phoneHash])
}

model AnalyticsEvent {
  id          String   @id @default(cuid())
  sessionId   String
  eventType   String
  metadata    Json?
  createdAt   DateTime @default(now())

  @@index([sessionId])
  @@index([eventType])
  @@index([createdAt])
}

model AdminUser {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}
```

### 마이그레이션 실행 (사용자가 `.env.local` 설정 후):

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## 3-2. Prisma 싱글톤 클라이언트

### 파일: `src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## 3-3. Supabase 클라이언트

### 파일: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

---

## 3-4. 암호화 유틸리티

### 파일: `src/lib/crypto.ts`

```typescript
import crypto from 'crypto';

const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
const ALGO = 'aes-256-gcm';

// 전화번호 암호화 (AES-256-GCM)
export function encryptPhone(phone: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(phone, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

// 전화번호 복호화
export function decryptPhone(encoded: string): string {
  const data = Buffer.from(encoded, 'base64');
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

// 전화번호 해시 (중복 체크용)
export function hashPhone(phone: string): string {
  return crypto.createHash('sha256').update(phone + KEY.toString()).digest('hex');
}

// IP 해시
export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + KEY.toString()).digest('hex');
}
```

---

## 3-5. API 라우트 업데이트

### 파일: `src/app/api/diagnose/route.ts` (수정)

기존 Phase 2 코드에 DB 저장 추가:

```typescript
// 기존 matchStartups 호출 후:
const sessionId = crypto.randomUUID();
const ip = req.headers.get('x-forwarded-for') || 'unknown';

await prisma.userResult.create({
  data: {
    sessionId,
    hardFilterInputs: parsed.hardFilter,
    competencyScores: parsed.competencyScores,
    personalityAnswers: parsed.personalityAnswers,
    top5Results: results,
    userAgent: req.headers.get('user-agent'),
    ipHash: hashIp(ip),
  },
});

return NextResponse.json({ sessionId, results });
```

### 파일: `src/app/api/result/[id]/route.ts` (신규)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await prisma.userResult.findUnique({
    where: { sessionId: params.id },
  });

  if (!result) {
    return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  }

  return NextResponse.json({
    sessionId: result.sessionId,
    results: result.top5Results,
    competencyScores: result.competencyScores,
    personalityAnswers: result.personalityAnswers,
    hardFilterInputs: result.hardFilterInputs,
    createdAt: result.createdAt,
  });
}
```

---

## 검증 체크리스트

```bash
# 1. Prisma 마이그레이션
npx prisma migrate dev --name init
# → 성공

# 2. Prisma Studio
npx prisma studio
# → 4개 테이블 확인 (UserResult, UserContact, AnalyticsEvent, AdminUser)

# 3. 암호화 테스트
node -e "
  const { encryptPhone, decryptPhone, hashPhone } = require('./src/lib/crypto');
  const phone = '010-1234-5678';
  const encrypted = encryptPhone(phone);
  const decrypted = decryptPhone(encrypted);
  console.log('원본:', phone);
  console.log('암호화:', encrypted);
  console.log('복호화:', decrypted);
  console.log('일치:', phone === decrypted);
  console.log('해시:', hashPhone(phone));
"

# 4. API → DB 저장 테스트
curl -X POST http://localhost:3000/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{ ... }'
# → sessionId 반환

# 5. 결과 조회
curl http://localhost:3000/api/result/[위에서 받은 sessionId]
# → 저장된 결과 반환
```
