@echo off
title OliveSmart System Launcher (Python 8000 + Spring Boot 8080 + React 3000)
color 0a
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo =======================================================================
echo   OLIVESMART FULLSTACK - LANCEMENT DES 3 MICROSERVICES
echo   1. Moteur IA & Vision Python (:8000)
echo   2. Microservice Java Spring Boot 3.3 (:8080)
echo   3. Frontend Client React 18 / Leaflet (:3000)
echo   EMSI - Moad Moussaoui & Noussaire Benassou
echo   Encadre par Pr. Mohamed Lachgar
echo =======================================================================
echo.

echo [1/3] Demarrage du Moteur IA Python (Port 8000)...
start "OliveSmart AI Engine :8000" cmd /k "cd /d "%SCRIPT_DIR%" && (if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) else if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat)) && python ai_engine_server.py"

echo [2/3] Demarrage du Microservice Spring Boot (Port 8080)...
start "OliveSmart Spring Boot :8080" cmd /k "cd /d "%SCRIPT_DIR%\springboot-microservice-olive" && (if exist target\olivesmart-detection-microservice-1.0.0.jar (java -jar target\olivesmart-detection-microservice-1.0.0.jar --server.port=8080) else (mvn spring-boot:run))"

echo [3/3] Demarrage du Frontend React (Port 3000)...
start "OliveSmart Frontend :3000" cmd /k "cd /d "%SCRIPT_DIR%\frontend-react" && node server.js"

echo.
echo Attente de 5 secondes pour initialisation des services...
timeout /t 5 /nobreak >nul

echo Ouverture de l'application dans votre navigateur...
start http://localhost:3000

echo =======================================================================
echo   Tous les services sont actifs !
echo   - Web UI   : http://localhost:3000
echo   - AI Engine: http://localhost:8000/health
echo   - Backend  : http://localhost:8080/api/v1/parcelles/metriques-modele
echo =======================================================================
pause
