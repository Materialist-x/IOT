using Project2.Core;

namespace Project2.Api
{
    public sealed class LicenseController
    {
        private readonly LicenseService _licenseService;

        public LicenseController(LicenseService licenseService)
        {
            _licenseService = licenseService;
        }

        public bool Validate(string tenantId, string deviceId)
        {
            return _licenseService.CheckOnConnect(tenantId, deviceId);
        }
    }
}
