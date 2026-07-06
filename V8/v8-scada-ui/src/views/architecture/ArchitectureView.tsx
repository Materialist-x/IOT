import {
  Activity,
  Bell,
  CloudCog,
  Cpu,
  Database,
  GitCompare,
  HardDrive,
  Network,
  RadioTower,
  RotateCcw,
  ShieldCheck,
  Workflow
} from "lucide-react";
import { PageTitle } from "../../components/base/PageTitle";

const cloudModules = ["配置中心", "设备注册", "告警规则", "历史数据", "License", "RBAC", "多租户", "日志观测"];
const edgeModules = ["配置代理", "IoScheduler", "协议引擎", "Tag 引擎", "断线缓存", "健康监测"];
const rules = [
  { title: "V8 Cloud", text: "控制全局，不碰设备；负责配置、治理、存储、告警和权限。", icon: CloudCog },
  { title: "V7 Edge", text: "只做执行；负责调度、协议生成、TCP/DTU 通信、解析和缓存。", icon: Cpu },
  { title: "MQTT 云边总线", text: "配置下发、数据回传、心跳健康和补传都通过统一主题约束。", icon: RadioTower }
];
const capabilities = [
  { title: "可追溯", text: "配置版本、发布时间、操作者和审计记录完整保留。", icon: GitCompare },
  { title: "可回滚", text: "设备、采集、告警配置按版本回滚，边缘热更新任务。", icon: RotateCcw },
  { title: "可观测", text: "心跳、连接状态、执行日志、缓存积压和链路延迟统一监控。", icon: Activity },
  { title: "断网可续传", text: "V7 本地 Buffer Store 暂存数据，恢复后自动补传。", icon: HardDrive }
];
const configTopics = ["v8/config/device/D1", "v8/config/polling/D1", "v8/config/alarm/D1"];
const dataTopics = ["v8/tag/update", "v7/heartbeat", "v8/alarm/event"];

export function ArchitectureView() {
  return (
    <>
      <PageTitle title="云边架构" extra={<span>Cloud-Managed Edge SCADA</span>} />
      <section className="architecture-page">
        <article className="architecture-definition">
          <div>
            <span className="eyebrow">一句话定义</span>
            <h2>云端统一配置 + 边缘执行 + 可追溯 + 可回滚 + 可观测的 SCADA 云边系统</h2>
          </div>
          <ShieldCheck size={34} />
        </article>

        <section className="architecture-flow" aria-label="云边系统链路">
          <ArchitectureNode
            title="V8 Cloud"
            subtitle="配置与治理层"
            icon={<CloudCog size={22} />}
            modules={cloudModules}
          />
          <div className="bus-column">
            <span>MQTT / gRPC / HTTP</span>
            <strong>Config + Data</strong>
          </div>
          <ArchitectureNode
            title="V7 Edge"
            subtitle="执行层"
            icon={<Cpu size={22} />}
            modules={edgeModules}
          />
          <div className="field-link">
            <Network size={20} />
            <span>DTU / TCP / RS485 / 645</span>
          </div>
          <article className="field-node">
            <strong>PLC / Instruments</strong>
            <span>现场设备只被边缘侧访问，云端不直接轮询。</span>
          </article>
        </section>

        <section className="principle-grid">
          {rules.map((item) => {
            const Icon = item.icon;
            return (
              <article className="principle-card" key={item.title}>
                <Icon size={21} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </section>

        <section className="architecture-split">
          <article className="panel config-panel">
            <h2><Workflow size={18} />配置是系统灵魂</h2>
            <div className="config-grid">
              <ConfigBlock
                title="DeviceConfig"
                lines={["deviceId: D1", "protocol: ModbusTCP", "host: 10.0.0.10", "port: 502", "enable: true"]}
              />
              <ConfigBlock
                title="PollingConfig"
                lines={["interval: 1000ms", "retry: 3", "timeout: 500ms", "tags: temp -> 40001"]}
              />
              <ConfigBlock
                title="AlarmConfig"
                lines={["tagId: temp", "condition: > 60", "level: HIGH"]}
              />
            </div>
            <div className="version-flow">
              <span>接收配置</span>
              <span>对比 version</span>
              <span>热更新 IoScheduler</span>
              <span>重建 polling task</span>
            </div>
          </article>

          <article className="panel topic-panel">
            <h2><RadioTower size={18} />云边主题</h2>
            <TopicGroup title="V8 → V7 配置下发" topics={configTopics} />
            <TopicGroup title="V7 → V8 数据回传" topics={dataTopics} />
          </article>
        </section>

        <section className="capability-grid">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <article className="capability-card" key={item.title}>
                <Icon size={20} />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="data-pipeline">
          <h2><Database size={18} />完整数据流</h2>
          {["V8 配置中心", "MQTT 配置主题", "V7 调度与协议引擎", "PLC / DTU / 645 / JSON", "V7 解析与 Tag 引擎", "MQTT 数据主题", "V8 历史库 / 告警 / WebSocket"].map((step, index) => (
            <div className="pipeline-step" key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </div>
          ))}
          <div className="pipeline-result">
            <Bell size={18} />
            <span>V8 写 Historian、触发 Alarm、推送前端实时态势。</span>
          </div>
        </section>
      </section>
    </>
  );
}

function ArchitectureNode({ title, subtitle, icon, modules }: { title: string; subtitle: string; icon: JSX.Element; modules: string[] }) {
  return (
    <article className="architecture-node">
      <header>
        {icon}
        <div>
          <h2>{title}</h2>
          <span>{subtitle}</span>
        </div>
      </header>
      <div className="module-list">
        {modules.map((module) => <span key={module}>{module}</span>)}
      </div>
    </article>
  );
}

function ConfigBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="config-block">
      <strong>{title}</strong>
      {lines.map((line) => <code key={line}>{line}</code>)}
    </div>
  );
}

function TopicGroup({ title, topics }: { title: string; topics: string[] }) {
  return (
    <div className="topic-group">
      <strong>{title}</strong>
      {topics.map((topic) => <code key={topic}>{topic}</code>)}
    </div>
  );
}
