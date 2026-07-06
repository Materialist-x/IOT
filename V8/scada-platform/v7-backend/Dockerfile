FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY v7-backend.csproj ./
RUN dotnet restore
COPY . ./
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 9000
ENTRYPOINT ["dotnet", "v7.dll"]
