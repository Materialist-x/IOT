import { AssetNode } from "../../domain/asset.model";
import { Device } from "../../types/domain";

const enterpriseId = "enterprise-v8";
const siteId = "site-main";
const defaultAreaId = "area-default";

export function buildAssetTree(devices: Device[]): AssetNode[] {
  const areas = new Map<string, AssetNode>();

  for (const device of devices) {
    const areaName = parseAreaName(device.location);
    const areaId = areaName ? `area-${slug(areaName)}` : defaultAreaId;
    if (!areas.has(areaId)) {
      areas.set(areaId, {
        id: areaId,
        name: areaName || "默认产线",
        type: "area",
        parentId: siteId,
        children: []
      });
    }

    areas.get(areaId)!.children!.push({
      id: device.assetId ?? `asset-${device.id}`,
      name: device.name,
      type: "device",
      parentId: areaId,
      deviceId: device.id
    });
  }

  return [
    {
      id: enterpriseId,
      name: "V8 工业集团",
      type: "enterprise",
      children: [
        {
          id: siteId,
          name: "一号工厂",
          type: "site",
          parentId: enterpriseId,
          children: Array.from(areas.values())
        }
      ]
    }
  ];
}

export function findAsset(nodes: AssetNode[], assetId: string): AssetNode | undefined {
  for (const node of nodes) {
    if (node.id === assetId) return node;
    const child = node.children ? findAsset(node.children, assetId) : undefined;
    if (child) return child;
  }
  return undefined;
}

export function findFirstDeviceAsset(nodes: AssetNode[]): AssetNode | undefined {
  for (const node of nodes) {
    if (node.type === "device") return node;
    const child = node.children ? findFirstDeviceAsset(node.children) : undefined;
    if (child) return child;
  }
  return undefined;
}

function parseAreaName(location?: string): string {
  return (location ?? "").split("/")[0]?.trim();
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").replace(/^-|-$/g, "") || "default";
}
