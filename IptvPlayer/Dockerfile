FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - &&\
    apt-get install -y nodejs

WORKDIR /src
COPY . .
RUN dotnet restore "IptvPlayer/IptvPlayer.csproj"
WORKDIR "/src/IptvPlayer"
RUN dotnet build "IptvPlayer.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "IptvPlayer.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "IptvPlayer.dll"]
