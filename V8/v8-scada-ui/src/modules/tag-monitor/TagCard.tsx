import { useTagStore } from "../../store/tagStore";

export function TagCard() {
  const tags = useTagStore((state) => state.tags);
  const deviceIds = Object.keys(tags);

  return (
    <section className="tag-card-grid">
      {deviceIds.map((deviceId) => (
        <article className="tag-card" key={deviceId}>
          <h3>{deviceId}</h3>
          {Object.entries(tags[deviceId]).map(([tagName, tag]) => (
            <div className="tag-row" key={tagName}>
              <span>{tagName}</span>
              <strong>{String(tag.value)}</strong>
              <small>{tag.multiplier && tag.multiplier !== 1 ? `x${tag.multiplier}` : tag.quality ?? "Unknown"}</small>
            </div>
          ))}
        </article>
      ))}
      {deviceIds.length === 0 ? <article className="panel empty-state">暂无实时 Tag 数据</article> : null}
    </section>
  );
}
