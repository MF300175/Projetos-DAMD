param(
    [string]$Profile = "localstack"
)

Write-Host "Criando bucket 'shopping-images' no LocalStack..." -ForegroundColor Cyan

aws --endpoint-url http://localhost:4566 `
    --profile $Profile `
    s3 mb s3://shopping-images


