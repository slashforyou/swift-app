. "$PSScriptRoot\steps\step-05-fill-client-firstname.ps1"
. "$PSScriptRoot\shared\utils.ps1"

$Context = @{ 
    TestData = @{ 
        Client = @{ 
            FirstName = 'Jean' 
        } 
    } 
}

Write-Host "Test de la fonction step 5..."
try {
    Step-05-Fill-Client-Firstname -Context $Context
    Write-Host "SUCCESS: Fonction executee"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "Details: $($_.Exception)"
}