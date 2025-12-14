param(
    [string]$Profile = "localstack"
)

Write-Host "Listando objetos do bucket 'shopping-images' no LocalStack..." -ForegroundColor Cyan

aws --endpoint-url http://localhost:4566 `
    --profile $Profile `
    s3 ls s3://shopping-images


