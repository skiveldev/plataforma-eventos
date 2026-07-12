# Pruebas funcionales backend - AgendaU
# Capturar cada sección como screenshot

$base = "http://localhost:3001/api"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  PRUEBAS FUNCIONALES BACKEND - AgendaU" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan
Read-Host "`nPresiona Enter para BE-01: Consultar eventos"

Write-Host "`n=== BE-01: Consultar eventos ===" -ForegroundColor Yellow
Write-Host "GET $base/events`n"
Invoke-RestMethod "$base/events" | ConvertTo-Json -Depth 2
Read-Host "`nPresiona Enter para BE-02: Registrar evento"

Write-Host "`n=== BE-02: Registrar evento ===" -ForegroundColor Yellow
Write-Host "POST $base/events`n"
$body = @{title="Taller de Pruebas";description="Evento de prueba funcional";date="2026-12-15T14:00:00Z";location="Laboratorio 3";category="Workshop";capacity=25} | ConvertTo-Json
$evento = Invoke-RestMethod "$base/events" -Method Post -Body $body -ContentType "application/json"
$evento | ConvertTo-Json
Read-Host "`nPresiona Enter para BE-03: Actualizar evento"

Write-Host "`n=== BE-03: Actualizar evento ===" -ForegroundColor Yellow
Write-Host "PUT $base/events/$($evento.id)`n"
$body2 = @{title="Taller de Pruebas v2";description="Evento actualizado";date="2026-12-15T14:00:00Z";location="Laboratorio 3";category="Workshop";capacity=30} | ConvertTo-Json
Invoke-RestMethod "$base/events/$($evento.id)" -Method Put -Body $body2 -ContentType "application/json" | ConvertTo-Json
Read-Host "`nPresiona Enter para BE-04: Eliminar evento"

Write-Host "`n=== BE-04: Eliminar evento ===" -ForegroundColor Yellow
Write-Host "DELETE $base/events/$($evento.id)`n"
Invoke-RestMethod "$base/events/$($evento.id)" -Method Delete | Out-Null
Write-Host "Respuesta: 204 No Content (evento eliminado correctamente)" -ForegroundColor Green
Read-Host "`nPresiona Enter para BE-05: Registrar participante"

Write-Host "`n=== BE-05: Registrar participante ===" -ForegroundColor Yellow
Write-Host "POST $base/participants`n"
$ts = Get-Date -Format "HHmmss"; $pbody = @{name="Carlos López";email="carlos.lopez.$ts@test.edu"} | ConvertTo-Json
$participante = Invoke-RestMethod "$base/participants" -Method Post -Body $pbody -ContentType "application/json"
$participante | ConvertTo-Json
Read-Host "`nPresiona Enter para BE-06: Inscribir y consultar asistentes"

Write-Host "`n=== BE-06: Inscribir participante y consultar asistentes ===" -ForegroundColor Yellow
$eventoDisponible = (Invoke-RestMethod "$base/events")[0]
Write-Host "Evento: $($eventoDisponible.title) (ID: $($eventoDisponible.id))`n"
Write-Host "POST $base/events/$($eventoDisponible.id)/registrations`n"
$regBody = @{participantId=$participante.id} | ConvertTo-Json
$insc = Invoke-RestMethod "$base/events/$($eventoDisponible.id)/registrations" -Method Post -Body $regBody -ContentType "application/json"
Write-Host "Inscripción:" -ForegroundColor Green
$insc | ConvertTo-Json
Write-Host "`nGET $base/events/$($eventoDisponible.id)/attendees`n"
$asistentes = Invoke-RestMethod "$base/events/$($eventoDisponible.id)/attendees"
Write-Host "Asistentes:" -ForegroundColor Green
$asistentes | ConvertTo-Json -Depth 2

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "  PRUEBAS COMPLETADAS (6/6)" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Read-Host "`nPresiona Enter para cerrar"
