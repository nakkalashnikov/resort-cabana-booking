# --- frontend build ---
FROM node:22-alpine AS frontend-build
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npx tsc -b && npx vite build --outDir /out/wwwroot

# --- backend build ---
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /src
COPY backend/ backend/
RUN dotnet publish backend/ResortMap.Api.csproj -c Release -o /app/publish

# --- runtime ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=backend-build /app/publish ./
COPY --from=frontend-build /out/wwwroot ./wwwroot
COPY assets ./assets
COPY map.ascii bookings.json ./

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "ResortMap.Api.dll"]
