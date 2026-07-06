import { Building2, Factory, FolderTree, Cpu } from "lucide-react";
import { AssetNode } from "../../domain/asset.model";

export function AssetTree({ assets, selectedAssetId, onSelect }: { assets: AssetNode[]; selectedAssetId: string | null; onSelect: (asset: AssetNode) => void }) {
  return (
    <div className="asset-tree">
      {assets.map((node) => (
        <AssetTreeNode key={node.id} node={node} selectedAssetId={selectedAssetId} onSelect={onSelect} depth={0} />
      ))}
    </div>
  );
}

function AssetTreeNode({ node, selectedAssetId, onSelect, depth }: { node: AssetNode; selectedAssetId: string | null; onSelect: (asset: AssetNode) => void; depth: number }) {
  const Icon = iconFor(node.type);
  return (
    <div>
      <button
        type="button"
        className={node.id === selectedAssetId ? "asset-tree-node active" : "asset-tree-node"}
        style={{ paddingLeft: 10 + depth * 16 }}
        onClick={() => onSelect(node)}
      >
        <Icon size={16} />
        <span>{node.name}</span>
      </button>
      {node.children?.map((child) => (
        <AssetTreeNode key={child.id} node={child} selectedAssetId={selectedAssetId} onSelect={onSelect} depth={depth + 1} />
      ))}
    </div>
  );
}

function iconFor(type: AssetNode["type"]) {
  if (type === "enterprise") return Building2;
  if (type === "site") return Factory;
  if (type === "device") return Cpu;
  return FolderTree;
}
