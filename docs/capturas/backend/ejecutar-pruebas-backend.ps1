$ErrorActionPreference = 'Stop'

$baseUrl = 'http://localhost:3001/api'
$outputDirectory = $PSScriptRoot
$stamp = Get-Date -Format 'yyyyMMddHHmmssfff'
$headers = @{ 'Content-Type' = 'application/json' }

function Write-Transcript {
    param([string]$FileName, [scriptblock]$Action)

    $path = Join-Path $outputDirectory $FileName
    & $Action 2>&1 | Tee-Object -FilePath $path
}

function Invoke-Api {
    param([string]$Method, [string]$Path, [object]$Body)

    $params = @{ Uri = "$baseUrl$Path"; Method = $Method; Headers = $headers }
    if ($null -ne $Body) { $params.Body = $Body | ConvertTo-Json -Compress }
    Invoke-WebRequest @params
}

try {
    Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing | Out-Null
} catch {
    throw "El backend no responde en $baseUrl. Inícielo antes de ejecutar este script."
}

$event = [ordered]@{
    title = "Prueba manual $stamp"
    description = 'Evento temporal para evidencia funcional manual.'
    date = '2026-12-15'
    location = 'Laboratorio de pruebas'
    category = 'Pruebas'
    capacity = 2
}
$updatedEvent = [ordered]@{
    title = "Prueba manual actualizada $stamp"
    description = 'Evento temporal actualizado para evidencia funcional manual.'
    date = '2026-12-16'
    location = 'Laboratorio de pruebas B'
    category = 'Pruebas'
    capacity = 3
}
$participant = [ordered]@{
    name = "Participante Prueba $stamp"
    email = "prueba.$stamp@agendau.local"
}

try {
Write-Transcript 'be-01-consultar-eventos.txt' {
    'GET /api/events'
    $response = Invoke-Api 'GET' '/events' $null
    "StatusCode: $($response.StatusCode)"
    $response.Content
}

$createdEvent = $null
Write-Transcript 'be-02-registrar-evento.txt' {
    'POST /api/events'
    $response = Invoke-Api 'POST' '/events' $event
    "StatusCode: $($response.StatusCode)"
    $response.Content
    $script:createdEvent = $response.Content | ConvertFrom-Json
}

Write-Transcript 'be-03-actualizar-evento.txt' {
    "PUT /api/events/$($createdEvent.id)"
    $response = Invoke-Api 'PUT' "/events/$($createdEvent.id)" $updatedEvent
    "StatusCode: $($response.StatusCode)"
    $response.Content
}

Write-Transcript 'be-04-eliminar-evento.txt' {
    "DELETE /api/events/$($createdEvent.id)"
    $response = Invoke-Api 'DELETE' "/events/$($createdEvent.id)" $null
    "StatusCode: $($response.StatusCode)"
}
$createdEvent = $null

$createdParticipant = $null
Write-Transcript 'be-05-registrar-participante.txt' {
    'POST /api/participants'
    $response = Invoke-Api 'POST' '/participants' $participant
    "StatusCode: $($response.StatusCode)"
    $response.Content
    $script:createdParticipant = $response.Content | ConvertFrom-Json
}

$registrationEvent = $null
Write-Transcript 'be-06-inscribir-y-consultar-asistentes.txt' {
    'POST /api/events (recurso temporal para inscripción)'
    $response = Invoke-Api 'POST' '/events' $event
    "StatusCode evento temporal: $($response.StatusCode)"
    $script:registrationEvent = $response.Content | ConvertFrom-Json

    "POST /api/events/$($registrationEvent.id)/registrations"
    $response = Invoke-Api 'POST' "/events/$($registrationEvent.id)/registrations" @{ participantId = $createdParticipant.id }
    "StatusCode inscripción: $($response.StatusCode)"
    $response.Content

    "GET /api/events/$($registrationEvent.id)/attendees"
    $response = Invoke-Api 'GET' "/events/$($registrationEvent.id)/attendees" $null
    "StatusCode asistentes: $($response.StatusCode)"
    $response.Content
}

Write-Host 'Pruebas completadas. Revise los seis transcriptos .txt y capture la ejecución en PowerShell.'
} finally {
    # Delete remaining temporary events if a documented case fails before its normal cleanup.
    foreach ($temporaryEvent in @($createdEvent, $registrationEvent)) {
        if ($null -ne $temporaryEvent) {
            try { Invoke-Api 'DELETE' "/events/$($temporaryEvent.id)" $null | Out-Null } catch { Write-Warning "No se pudo eliminar el evento temporal $($temporaryEvent.id)." }
        }
    }
}
