@echo off
title OliveSmart Frontend React (Port 3000)
color 1f
echo =======================================================================
echo   OLIVESMART - FRONTEND REACT 18 (PORT 3000)
echo   Auteur : Moad Moussaoui - Equipe OLV-1
echo =======================================================================
echo.
echo Demarrage du serveur React sur http://localhost:3000 ...
echo Connecte au Microservice Java Spring Boot sur http://localhost:8080
echo.
start http://localhost:3000
cd /d "c:\Users\hp\Pictures\Olive-Project\frontend-react"
node server.js
pause
