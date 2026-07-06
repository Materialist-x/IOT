# SCADA Platform

This folder contains a runnable V7 backend plus V8 frontend SCADA stack.

## One-click start on Linux VM

Fresh VM:

```bash
git clone https://github.com/Materialist-x/-IoT.git ~/-IoT
cd ~/-IoT/scada-platform
bash ./bootstrap-vm.sh
```

Already cloned repo:

```bash
cd ~/-IoT/scada-platform
bash ./bootstrap-vm.sh
```

## One-click start on Windows PowerShell

```powershell
Set-Location D:\path\to\-IoT\scada-platform
.\bootstrap-vm.ps1
```

## What the script does

1. Pulls the latest repo code if the repo already exists.
2. Clones `Materialist-x/-IoT` if the repo is missing.
3. Enters `scada-platform/`.
4. Runs `docker compose up -d --build`.
5. Prints container status.

## URLs

- Nginx entry: [http://localhost](http://localhost)
- V8 frontend direct: [http://localhost:5173](http://localhost:5173)
- V7 backend: [http://localhost:9000](http://localhost:9000)
- Swagger: [http://localhost:9000/swagger](http://localhost:9000/swagger)
- TCP simulation API: [http://localhost:9000/api/simulation/tcp](http://localhost:9000/api/simulation/tcp)

## Structure

```text
scada-platform/
|-- docker-compose.yml
|-- bootstrap-vm.sh
|-- bootstrap-vm.ps1
|-- nginx/
|-- v7-backend/
`-- v8-frontend/
```
