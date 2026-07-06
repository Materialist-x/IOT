using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Project2.History;
using Project2.Logging;
using Project2.Protocol;
using Project2.Realtime;

namespace Project2.Core
{
    public sealed class ScadaRuntime
    {
        public ScadaRuntime(
            SessionManager sessionManager,
            LicenseService licenseService,
            TenantResolver tenantResolver,
            BillingEngine billingEngine,
            RateLimiter rateLimiter,
            RbacService rbacService,
            CommandService commandService,
            ChannelQueue channelQueue,
            MessageDispatcher dispatcher,
            BatchWriter batchWriter,
            UnifiedTcpServer tcpServer,
            RedisService redisService,
            InfluxService influxService,
            WebSocketHub webSocketHub,
            TcpGateway tcpGateway,
            InMemoryBulkTagValueRepository repository,
            ScadaRuntimeOptions options,
            ILogger logger)
        {
            SessionManager = sessionManager;
            LicenseService = licenseService;
            TenantResolver = tenantResolver;
            BillingEngine = billingEngine;
            RateLimiter = rateLimiter;
            RbacService = rbacService;
            CommandService = commandService;
            ChannelQueue = channelQueue;
            Dispatcher = dispatcher;
            BatchWriter = batchWriter;
            TcpServer = tcpServer;
            RedisService = redisService;
            InfluxService = influxService;
            WebSocketHub = webSocketHub;
            TcpGateway = tcpGateway;
            Repository = repository;
            Options = options;
            Logger = logger;
        }

        public SessionManager SessionManager { get; private set; }

        public LicenseService LicenseService { get; private set; }

        public TenantResolver TenantResolver { get; private set; }

        public BillingEngine BillingEngine { get; private set; }

        public RateLimiter RateLimiter { get; private set; }

        public RbacService RbacService { get; private set; }

        public CommandService CommandService { get; private set; }

        public ChannelQueue ChannelQueue { get; private set; }

        public MessageDispatcher Dispatcher { get; private set; }

        public BatchWriter BatchWriter { get; private set; }

        public UnifiedTcpServer TcpServer { get; private set; }

        public RedisService RedisService { get; private set; }

        public InfluxService InfluxService { get; private set; }

        public WebSocketHub WebSocketHub { get; private set; }

        public TcpGateway TcpGateway { get; private set; }

        public InMemoryBulkTagValueRepository Repository { get; private set; }

        public ScadaRuntimeOptions Options { get; private set; }

        public ILogger Logger { get; private set; }

        public static ScadaRuntime Create()
        {
            return Create(ScadaRuntimeOptions.Default());
        }

        public static ScadaRuntime Create(ScadaRuntimeOptions options)
        {
            var logger = new ConsoleLogger();
            var tenantResolver = new TenantResolver();
            tenantResolver.RegisterTenant(new Project2.Models.Tenant
            {
                TenantId = "default",
                TenantName = "Default Tenant",
                Status = Project2.Models.TenantStatus.Active,
                ExpireTime = DateTime.UtcNow.AddYears(1),
                PlanType = Project2.Models.PlanType.Enterprise
            });
            var sessionManager = new SessionManager(options.IdleTimeout);
            var licenseService = new LicenseService(options.LicenseHeartbeatInterval, tenantResolver.IsTenantActive);
            licenseService.CheckOnConnect("default", "bootstrap");
            var billingEngine = new BillingEngine(options.MaxDevicesPerTenant, options.MaxThroughputBytesPerTenant);
            var rateLimiter = new RateLimiter(options.MaxTenantMessagesPerSecond, options.MaxDeviceMessagesPerSecond);
            var rbacService = new RbacService();
            var commandService = new CommandService();
            var repository = new InMemoryBulkTagValueRepository();
            var batchWriter = new BatchWriter(repository, logger, options.BatchFlushInterval);
            var memoryCache = new MemoryCache();
            var redisService = new RedisService();
            var influxService = new InfluxService();
            var webSocketHub = new WebSocketHub();
            var protocolEngine = new ProtocolEngine();
            var protocolDispatcher = new ProtocolDispatcher();
            var tagEngine = new TagEngine(memoryCache, redisService, influxService, webSocketHub);
            var bus = new MessageBus(protocolEngine, tagEngine);
            var channelQueue = new ChannelQueue(
                new ChannelQueueOptions { BackpressureThreshold = options.BackpressureThreshold },
                logger);
            var dispatcher = new MessageDispatcher(
                bus,
                sessionManager,
                licenseService,
                channelQueue,
                tenantResolver,
                billingEngine,
                rateLimiter);
            var tcpServer = new UnifiedTcpServer(
                sessionManager,
                channelQueue,
                licenseService,
                tenantResolver,
                billingEngine,
                logger);
            var tcpGateway = new TcpGateway(licenseService, sessionManager, protocolDispatcher, tagEngine);

            return new ScadaRuntime(
                sessionManager,
                licenseService,
                tenantResolver,
                billingEngine,
                rateLimiter,
                rbacService,
                commandService,
                channelQueue,
                dispatcher,
                batchWriter,
                tcpServer,
                redisService,
                influxService,
                webSocketHub,
                tcpGateway,
                repository,
                options,
                logger);
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            ChannelQueue.StartConsumer(Dispatcher.DispatchAsync, cancellationToken);
            var batchTask = BatchWriter.StartAsync(cancellationToken);
            var tcpTask = TcpServer.StartAsync(IPAddress.Any, Options.TcpPort, cancellationToken);
            return Task.WhenAll(batchTask, tcpTask);
        }
    }
}
