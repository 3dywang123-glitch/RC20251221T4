# 开发环境启动脚本

# 1. 启动后端服务器
Write-Host "Starting backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

# 等待2秒
Start-Sleep -Seconds 2

# 2. 启动前端开发服务器
Write-Host "Starting frontend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "`nBoth servers are starting..." -ForegroundColor Cyan
Write-Host "Backend: http://localhost:3001" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "`nPress Ctrl+C in each window to stop the servers" -ForegroundColor Gray
