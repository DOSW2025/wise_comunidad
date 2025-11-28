#!/usr/bin/env pwsh
# Script to set up and test the Foros module
# Usage: .\test-foros.ps1

Write-Host "🚀 Initializing Foros Testing Environment..." -ForegroundColor Cyan

# Set database URL
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/wise_comunidad"

# Step 1: Generate Prisma Client
Write-Host "`n📦 Step 1: Generating Prisma Client..." -ForegroundColor Yellow
npx.cmd prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma generate failed" -ForegroundColor Red
    exit 1
}

# Step 2: Check if database is accessible
Write-Host "`n🔍 Step 2: Checking database connection..." -ForegroundColor Yellow
npx.cmd prisma db execute --stdin --file /dev/null 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Database not accessible. Make sure PostgreSQL is running on localhost:5432" -ForegroundColor Yellow
    Write-Host "To start PostgreSQL (if installed via WSL/Docker):" -ForegroundColor Gray
    Write-Host "   wsl -d Ubuntu sudo service postgresql start" -ForegroundColor Gray
    exit 1
}

# Step 3: Apply migrations
Write-Host "`n🗄️  Step 3: Applying database migrations..." -ForegroundColor Yellow
npx.cmd prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Migration deploy failed. Trying prisma db push..." -ForegroundColor Yellow
    npx.cmd prisma db push --skip-generate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Could not apply migrations" -ForegroundColor Red
        exit 1
    }
}

# Step 4: Build project
Write-Host "`n🏗️  Step 4: Building project..." -ForegroundColor Yellow
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Step 5: Run e2e tests
Write-Host "`n🧪 Step 5: Running e2e tests..." -ForegroundColor Yellow
npm.cmd run test:e2e
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Some tests failed" -ForegroundColor Yellow
} else {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
}

Write-Host "`n📖 For manual testing, start the app with: npm.cmd run start:dev" -ForegroundColor Cyan
Write-Host "📚 See TESTING.md for API examples" -ForegroundColor Cyan
