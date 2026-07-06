# VM Deployment

Fresh Linux VM:

```bash
curl -fsSL https://raw.githubusercontent.com/Materialist-x/IOT/main/scripts/iotctl.sh | sudo bash -s -- deploy
```

Update later:

```bash
sudo iotctl update
```

Common commands:

```bash
sudo iotctl status
sudo iotctl logs
sudo iotctl restart
sudo iotctl down
```

Defaults:

- Repository: `https://github.com/Materialist-x/IOT.git`
- Branch: `main`
- Install path: `/opt/iot`
- Main compose file: `/opt/iot/V8/docker-compose.yml`
- Frontend: `http://<vm-ip>:3000`
- Gateway health: `http://<vm-ip>:8080/health`

Override example:

```bash
IOT_APP_DIR=/data/iot IOT_BRANCH=main sudo -E iotctl update
```
