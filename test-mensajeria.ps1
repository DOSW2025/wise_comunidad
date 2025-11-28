#!/usr/bin/env pwsh

# Script de prueba para el sistema de mensajería en Foros
# Uso: .\test-mensajeria.ps1

$baseUrl = "http://localhost:3000"

Write-Host "===================================================" -ForegroundColor Green
Write-Host "PRUEBAS DEL SISTEMA DE MENSAJERÍA" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green

# 1. Crear un foro para pruebas
Write-Host "`n[1/5] Creando foro de prueba..." -ForegroundColor Cyan
$forumResponse = Invoke-RestMethod -Uri "$baseUrl/forums" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
      slug = "test-mensajeria-$(Get-Random)"
      nombre = "Foro de Prueba - Mensajería"
      descripcion = "Foro para probar el sistema de mensajería"
      materiaId = "MAT101"
  } | ConvertTo-Json)

$forumId = $forumResponse.data.id
Write-Host "✅ Foro creado con ID: $forumId" -ForegroundColor Green

# 2. Enviar primer mensaje
Write-Host "`n[2/5] Enviando primer mensaje..." -ForegroundColor Cyan
$message1 = Invoke-RestMethod -Uri "$baseUrl/forums/$forumId/messages" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
      contenido = "Este es el primer mensaje de prueba"
      authorId = "test-user-001"
  } | ConvertTo-Json)

Write-Host "✅ Primer mensaje enviado con ID: $($message1.data.id)" -ForegroundColor Green
Write-Host "   Contenido: $($message1.data.contenido)"
Write-Host "   Autor: $($message1.data.author.nombre) $($message1.data.author.apellido)"

# 3. Enviar segundo mensaje
Write-Host "`n[3/5] Enviando segundo mensaje..." -ForegroundColor Cyan
$message2 = Invoke-RestMethod -Uri "$baseUrl/forums/$forumId/messages" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
      contenido = "Este es el segundo mensaje de prueba"
      authorId = "test-user-002"
  } | ConvertTo-Json)

Write-Host "✅ Segundo mensaje enviado con ID: $($message2.data.id)" -ForegroundColor Green

# 4. Listar todos los mensajes
Write-Host "`n[4/5] Listando todos los mensajes..." -ForegroundColor Cyan
$messagesList = Invoke-RestMethod -Uri "$baseUrl/forums/$forumId/messages?page=1" `
  -Method GET `
  -Headers @{"Content-Type"="application/json"}

Write-Host "✅ Se encontraron $($messagesList.data.pagination.total) mensajes" -ForegroundColor Green
Write-Host "   Página: $($messagesList.data.pagination.page)/$($messagesList.data.pagination.totalPages)"
Write-Host "   Mostrando: $($messagesList.data.mensajes.Count) mensajes"

foreach ($msg in $messagesList.data.mensajes) {
    Write-Host "   - [$($msg.id)] $($msg.author.nombre): $($msg.contenido) (Leído: $($msg.leido))" -ForegroundColor Gray
}

# 5. Marcar primer mensaje como leído
Write-Host "`n[5/5] Marcando primer mensaje como leído..." -ForegroundColor Cyan
$readResponse = Invoke-RestMethod -Uri "$baseUrl/forums/$forumId/messages/$($message1.data.id)/read" `
  -Method POST

Write-Host "✅ Mensaje marcado como leído" -ForegroundColor Green
Write-Host "   Estado actual: $($readResponse.data.leido)" -ForegroundColor Gray

# 6. Obtener contador de no leídos
Write-Host "`n[BONUS] Contando mensajes no leídos..." -ForegroundColor Cyan
$unreadCount = Invoke-RestMethod -Uri "$baseUrl/forums/$forumId/messages/unread/count" `
  -Method GET `
  -Headers @{"Content-Type"="application/json"}

Write-Host "✅ Mensajes no leídos: $($unreadCount.unreadCount)" -ForegroundColor Green

Write-Host "`n===================================================" -ForegroundColor Green
Write-Host "PRUEBAS COMPLETADAS EXITOSAMENTE" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
