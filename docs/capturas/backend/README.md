# Evidencia de Pruebas Manuales de Backend

Cada caso debe documentarse con una captura real de una ventana de PowerShell en la que se vean el comando y su resultado contra `http://localhost:3001`. Los transcriptos `.txt` generados por el script sirven como respaldo verificable, pero no sustituyen las capturas de terminal.

| Prueba | Archivo de captura requerido | Transcripto esperado | Instrucción |
|---------|------------------------------|----------------------|-------------|
| BE-01 Consultar eventos | `be-01-consultar-eventos.png` | `be-01-consultar-eventos.txt` | Ejecutar el script con el backend en marcha y capturar la consulta en PowerShell. |
| BE-02 Registrar evento | `be-02-registrar-evento.png` | `be-02-registrar-evento.txt` | Capturar la respuesta `201` del alta de evento de prueba. |
| BE-03 Actualizar evento | `be-03-actualizar-evento.png` | `be-03-actualizar-evento.txt` | Capturar la respuesta `200` de la actualización. |
| BE-04 Eliminar evento | `be-04-eliminar-evento.png` | `be-04-eliminar-evento.txt` | Capturar la respuesta `204` de la eliminación. |
| BE-05 Registrar participante | `be-05-registrar-participante.png` | `be-05-registrar-participante.txt` | Capturar la respuesta `201` del alta del participante de prueba. |
| BE-06 Inscribir participante y consultar asistentes | `be-06-inscribir-y-consultar-asistentes.png` | `be-06-inscribir-y-consultar-asistentes.txt` | Capturar las respuestas `201` y `200` de inscripción y consulta. |

Antes de ejecutar, inicie el backend en otra consola y confirme que responde en el puerto `3001`. Luego ejecute:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\docs\capturas\backend\ejecutar-pruebas-backend.ps1
```

El script usa datos con una marca temporal única. Elimina los eventos de prueba creados; el participante se conserva porque la API no expone una operación de eliminación para ese recurso.
