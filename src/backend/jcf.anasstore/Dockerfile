FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY jcf.anasstore.slnx ./
COPY src/ ./src/
COPY tests/ ./tests/

RUN dotnet restore jcf.anasstore.slnx
RUN dotnet publish src/Jcf.AnasStore.Api/Jcf.AnasStore.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app
COPY --from=build /app/publish ./

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgssapi-krb5-2 libkrb5-3 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1001 -s /bin/bash appuser \
    && chown -R appuser:appuser /app
USER appuser

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Jcf.AnasStore.Api.dll"]
