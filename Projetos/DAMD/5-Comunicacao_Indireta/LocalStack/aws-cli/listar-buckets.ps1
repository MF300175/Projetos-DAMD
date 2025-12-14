param(
    [string]$Profile = "localstack"
)

Write-Host "Listando buckets no LocalStack..." -ForegroundColor Cyan

aws --endpoint-url http://localhost:4566 `
    --profile $Profile `
    s3 ls


