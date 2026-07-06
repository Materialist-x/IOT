import { create } from "zustand";
import { AssetNode } from "../domain/asset.model";
import { buildAssetTree, findFirstDeviceAsset } from "../modules/asset/assetModel";
import { Device } from "../types/domain";

type AssetState = {
  assets: AssetNode[];
  selectedAssetId: string | null;
  syncFromDevices: (devices: Device[]) => void;
  selectAsset: (assetId: string) => void;
};

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  selectedAssetId: null,
  syncFromDevices: (devices) => {
    const assets = buildAssetTree(devices);
    const selectedAssetId = get().selectedAssetId ?? findFirstDeviceAsset(assets)?.id ?? assets[0]?.id ?? null;
    set({ assets, selectedAssetId });
  },
  selectAsset: (assetId) => set({ selectedAssetId: assetId })
}));
