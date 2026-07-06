import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useEffect, useMemo, useState } from "react";
import { DataBinder } from "../core/DataBinder";
import { Renderer } from "../core/Renderer";
import { RuntimeTagUpdate, ScadaLayout } from "../core/types";
import { registerIndustrialWidgets } from "../widgets/registerWidgets";

registerIndustrialWidgets();

type ScadaRuntimeProps = {
  tenantId: string;
  layout: ScadaLayout;
  signalrUrl: string;
  mode: "runtime" | "editor";
  onConnectionState?: (state: string) => void;
  onTag?: (tag: RuntimeTagUpdate) => void;
  onAlarm?: (alarm: unknown) => void;
};

export function ScadaRuntime({ tenantId, layout, signalrUrl, mode, onConnectionState, onTag, onAlarm }: ScadaRuntimeProps) {
  const binder = useMemo(() => new DataBinder(), []);
  const [changedVersion, setChangedVersion] = useState(0);

  useEffect(() => {
    binder.loadWidgets(layout.widgets);
    return binder.subscribe(() => setChangedVersion((version) => version + 1));
  }, [binder, layout]);

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(`${signalrUrl}/tenant/${tenantId}/tags`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connection.on("tag", (json: string) => {
      const update = normalizeIncomingTag(JSON.parse(json));
      binder.applyUpdate(update);
      onTag?.(update);
    });

    connection.on("alarm", (json: string) => onAlarm?.(JSON.parse(json)));
    connection.start().then(() => onConnectionState?.("connected")).catch(() => onConnectionState?.("failed"));
    connection.onreconnecting(() => onConnectionState?.("reconnecting"));
    connection.onreconnected(() => onConnectionState?.("connected"));
    connection.onclose(() => onConnectionState?.("offline"));

    return () => {
      void connection.stop();
    };
  }, [binder, onAlarm, onConnectionState, onTag, signalrUrl, tenantId]);

  return <Renderer layout={layout} binder={binder} changedVersion={changedVersion} mode={mode} />;
}

function normalizeIncomingTag(input: any): RuntimeTagUpdate {
  return {
    tenantId: input.tenantId ?? input.TenantId,
    deviceId: input.deviceId ?? input.DeviceId,
    tagName: input.tagName ?? input.tag ?? input.TagName,
    value: input.value ?? input.Value,
    timestamp: input.timestamp ?? input.Timestamp ?? new Date().toISOString(),
    quality: input.quality ?? input.Quality,
    source: input.source ?? input.Source,
    sourceProtocol: input.sourceProtocol
  };
}
