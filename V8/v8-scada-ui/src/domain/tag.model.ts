export type TagDataType = "int" | "float" | "bool" | "string";
export type TagQuality = "good" | "bad" | "uncertain";

export type TagValue = {
  id: string;
  name: string;
  assetId: string;
  value: number | string | boolean;
  dataType: TagDataType;
  quality: TagQuality;
  ts: number;
};
