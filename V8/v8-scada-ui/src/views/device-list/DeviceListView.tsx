import { PageTitle } from "../../components/base/PageTitle";
import { AssetTree } from "../../modules/asset/AssetTree";
import { DeviceCreateForm } from "../../modules/device/DeviceCreateForm";
import { DevicePanel } from "../../modules/device/DevicePanel";
import { DeviceTable } from "../../modules/device/DeviceTable";
import { TagConfigPanel } from "../../modules/tag-monitor/TagConfigPanel";
import { findAsset, findFirstDeviceAsset } from "../../modules/asset/assetModel";
import { AssetNode } from "../../domain/asset.model";
import { useAssetStore } from "../../store/assetStore";
import { useDeviceStore } from "../../store/deviceStore";
import { useEffect, useMemo } from "react";

export function DeviceListView() {
  const devices = useDeviceStore((state) => state.devices);
  const assets = useAssetStore((state) => state.assets);
  const selectedAssetId = useAssetStore((state) => state.selectedAssetId);
  const syncFromDevices = useAssetStore((state) => state.syncFromDevices);
  const selectAsset = useAssetStore((state) => state.selectAsset);
  const selectedAsset = useMemo(() => selectedAssetId ? findAsset(assets, selectedAssetId) : findFirstDeviceAsset(assets), [assets, selectedAssetId]);
  const selectedDevice = useMemo(() => devices.find((device) => device.id === selectedAsset?.deviceId), [devices, selectedAsset]);
  const registerParent = selectedAsset?.type === "device" ? findAsset(assets, selectedAsset.parentId ?? "") : selectedAsset;

  useEffect(() => {
    syncFromDevices(devices);
  }, [devices, syncFromDevices]);

  return (
    <>
      <PageTitle title="设备与资产管理" extra={<span>Enterprise / Site / Area / Device / Tag</span>} />
      <section className="industrial-device-layout">
        <aside className="panel asset-panel">
          <h2>资产树</h2>
          <AssetTree assets={assets} selectedAssetId={selectedAsset?.id ?? null} onSelect={(asset: AssetNode) => selectAsset(asset.id)} />
        </aside>

        <section className="device-workspace">
          <DevicePanel device={selectedDevice} />
          <TagConfigPanel assetId={selectedAsset?.type === "device" ? selectedAsset.id : undefined} deviceId={selectedDevice?.id} />
          <article className="panel"><h2>设备台账</h2><DeviceTable /></article>
        </section>

        <aside className="panel asset-panel">
          <h2>注册设备</h2>
          <DeviceCreateForm parentAssetId={registerParent?.id} parentLocation={registerParent?.name} />
        </aside>
      </section>
    </>
  );
}
