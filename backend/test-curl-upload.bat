@echo off
echo Testando upload com arquivo pequeno...
curl -X POST http://localhost:3010/api/v2/upload ^
  -F "file=@test-minimal.csv" ^
  -H "Content-Type: multipart/form-data" ^
  --verbose