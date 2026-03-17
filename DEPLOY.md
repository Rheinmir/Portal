# Vercel Deployment Plan

## Prerequisites (Manual — dev phải tự làm)

### 1. Supabase — chạy schema
Vào **Supabase Dashboard → SQL Editor**, paste và chạy toàn bộ `supabase_schema.sql`.

Sau đó tạo storage bucket thủ công:
- Dashboard → **Storage → New bucket**
- Name: `temp_images`, Public: ✅

Tạo admin account (đổi password nếu muốn):
```sql
INSERT INTO public.admins (username, password_hash, role)
VALUES ('admin', 'd530188ef6ef7331ea07ae086603a110a30b4da48d56b0d91295fcfa24fcf37d', 'superadmin')
ON CONFLICT (username) DO NOTHING;
```
> Password mặc định: `miniappadmin`

Lấy keys: **Project Settings → API**
- `SUPABASE_URL` = Project URL
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key (secret)

---

### 2. Vercel — cài CLI & login
```bash
npm i -g vercel
vercel login
```

---

### 3. Set env vars trên Vercel
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
```
Chọn environment: **Production, Preview, Development** cho cả hai.

---

## Deploy (1 lệnh)

```bash
vercel --prod
```

Vercel sẽ tự:
- Build frontend: `vite build` → `dist/`
- Deploy backend: `api/index.js` → serverless function
- Route `/api/*` và `/temp/*` → function theo `vercel.json`

---

## Verify

```bash
curl https://<your-domain>.vercel.app/api/health
```

Expected:
```json
{"status":"ok","database":"connected",...}
```

---

## Gotchas

| Vấn đề | Ghi chú |
|--------|---------|
| `sharp` native binary | Vercel Linux x64 — hoạt động, không cần config thêm |
| Temp image cleanup | `setTimeout` best-effort trên serverless — file có thể leak. Nên thêm Supabase cron/trigger xóa bucket sau 1h |
| Click counter race | Concurrent clicks có thể miss count — dùng Supabase RPC `increment` nếu cần chính xác |
| Auth | `/api/login` trả `{success, role}` nhưng không có JWT — các route admin không được bảo vệ ở HTTP level |
| `server/index.js` | File chết, không dùng trong deploy Vercel |
