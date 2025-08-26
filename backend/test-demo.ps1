# PowerShell script to test demo request API
$uri = "http://localhost:5000/api/v1/demo-requests"
$body = @{
    firstName = "John"
    lastName = "Doe" 
    email = "john.doe@testcompany.com"
    company = "Test Company Inc."
    jobTitle = "CEO"
    phoneNumber = "+1-555-0123"
    companySize = "50-200"
    industry = "Technology"
    message = "We are interested in your cartel detection platform."
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "🧪 Testing Demo Request Submission..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -Body $body -Headers $headers
    Write-Host "✅ Demo request submitted successfully!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
}
catch {
    Write-Host "❌ Error submitting demo request:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}
