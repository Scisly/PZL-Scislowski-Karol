# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS web-build
WORKDIR /build/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0.404 AS api-build
WORKDIR /build
COPY global.json Directory.Build.props ./
COPY src/TaskFlow.Domain/TaskFlow.Domain.csproj src/TaskFlow.Domain/
COPY src/TaskFlow.Api/TaskFlow.Api.csproj src/TaskFlow.Api/
RUN dotnet restore src/TaskFlow.Api/TaskFlow.Api.csproj
COPY src/ src/
RUN dotnet publish src/TaskFlow.Api/TaskFlow.Api.csproj --configuration Release --no-restore --output /out /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
USER root
RUN apt-get update && apt-get install --yes --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=api-build /out/ ./
COPY --from=web-build /build/web/dist/ ./wwwroot/
ENV ASPNETCORE_HTTP_PORTS=8080 \
    DOTNET_EnableDiagnostics=0
EXPOSE 8080
USER $APP_UID
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=12 CMD curl --fail --silent http://localhost:8080/api/health/ready || exit 1
ENTRYPOINT ["dotnet", "TaskFlow.Api.dll"]
