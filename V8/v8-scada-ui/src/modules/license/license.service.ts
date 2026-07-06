import { api } from "../../api/http";

export type LicenseActivationResult = {
  valid: boolean;
  licenseKey?: string;
  message?: string;
};

export class LicenseService {
  static async activateDevice(code: string, deviceId: string): Promise<LicenseActivationResult> {
    const result = await api.post<LicenseActivationResult>("/license/activate", { code, deviceId });
    if (!result?.valid) {
      throw new Error(result?.message ?? "激活码无效");
    }
    return result;
  }
}
