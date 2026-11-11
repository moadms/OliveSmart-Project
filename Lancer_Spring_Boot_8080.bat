@echo off
title OliveSmart Spring Boot Microservice (Port 8080)
color 2f
echo =======================================================================
echo   OLIVESMART - MICROSERVICE JAVA SPRING BOOT 3.2 (PORT 8080)
echo   Auteur : Moad Moussaoui - Equipe OLV-1
echo =======================================================================
echo.
if "%JAVA_HOME%"=="" (
    if exist "C:\Program Files\Java\jdk-21" set "JAVA_HOME=C:\Program Files\Java\jdk-21"
    if exist "C:\Program Files\Java\jdk-17" set "JAVA_HOME=C:\Program Files\Java\jdk-17"
)
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"
echo Verification Java :
java -version
echo.
echo Demarrage de l'API REST sur http://localhost:8080 ...
echo Endpoint d'analyse cadastrale : POST /api/v1/parcelles/analyser
echo.
cd /d "%~dp0springboot-microservice-olive"
if exist target\olivesmart-detection-microservice-1.0.0.jar (
    java -jar target\olivesmart-detection-microservice-1.0.0.jar --server.port=8080
) else (
    mvn spring-boot:run
)
pause
