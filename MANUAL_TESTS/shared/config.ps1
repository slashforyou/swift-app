# Configuration globale pour tous les tests
# Ce fichier contient les parametres communs a toutes les suites de tests

# Configuration ADB
$global:ADB = "C:\Users\romai\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$global:DEVICE = "192.168.0.250:35031"
$global:EXPO_URL = "exp://192.168.0.51:8081"

# Identifiants de connexion
$global:TEST_AUTH = @{
    Email = "romaingiovanni@gmail.com"
    Password = "IllBeThere4_U"
}

# Fonction pour generer des donnees uniques
function Get-Timestamp {
    return Get-Date -Format "HHmmss"
}

function Get-TestClient {
    param([string]$timestamp)
    
    if (-not $timestamp) {
        $timestamp = Get-Timestamp
    }
    
    return @{
        FirstName = "Jean"
        LastName = "Dupont"
        Email = "jean.dupont.$timestamp@test.com"
        Phone = "0612345678"
    }
}

function Get-TestPickupAddress {
    return @{
        Street = "123%sMain%sStreet"
        City = "Sydney"
        State = "NSW"
        Zip = "2000"
    }
}

function Get-TestDeliveryAddress {
    return @{
        Street = "456%sOak%sAvenue"
        City = "Melbourne"
        State = "VIC"
        Zip = "3000"
    }
}

function Get-TestSchedule {
    return @{
        StartTime = "09:00"
        EndTime = "17:00"
        Duration = "4"
    }
}

function Get-TestDetails {
    return @{
        Priority = "Medium"  # Low, Medium, High, Urgent
        Notes = "Test%sjob%s-%sautomated%stest"
    }
}
