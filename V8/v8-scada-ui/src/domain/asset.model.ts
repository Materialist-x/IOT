import { TagValue } from "./tag.model";

export type AssetNodeType = "enterprise" | "site" | "area" | "device";

export type AssetNode = {
  id: string;
  name: string;
  type: AssetNodeType;
  parentId?: string;
  deviceId?: string;
  children?: AssetNode[];
  tags?: TagValue[];
};
