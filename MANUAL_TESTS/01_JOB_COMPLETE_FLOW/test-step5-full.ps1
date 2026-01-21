cd "C:\Users\romai\OneDrive\Documents\client\Swift\App\swift-app\MANUAL_TESTS\01_JOB_COMPLETE_FLOW"

try {
    # Charger tous les utils nécessaires
    . ".\shared\utils.ps1"
    . ".\steps\step-05-fill-client-firstname.ps1"
    
    $Context = @{ 
        TestData = @{ 
            Client = @{ 
                FirstName = 'Jean' 
            } 
        } 
    }
    
    Write-Host "=== EXECUTION STEP 5 AVEC UTILS CORRECT ==="
    $result = Step-05-Fill-Client-Firstname -Context $Context
    Write-Host "Resultat: $result"
    
    if ($result) {
        Write-Host "SUCCESS: Step 5 fonctionne correctement"
    } else {
        Write-Host "FAIL: Step 5 a retourne false"
    }
} catch {
    Write-Host "EXCEPTION: $($_.Exception.Message)"
    Write-Host "StackTrace: $($_.Exception.StackTrace)"
    Write-Host "ErrorDetails: $($_.ErrorDetails)"
}