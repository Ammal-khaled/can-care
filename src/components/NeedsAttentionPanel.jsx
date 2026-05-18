import React from "react";
import "./NeedsAttentionPanel.css";

const NeedsAttentionPanel = ({ items = [] }) => {
  return (
    <section className="needs-attention-panel" aria-label="Needs attention">
      <div className="needs-attention-header">
        <div>
          <span className="needs-attention-kicker">Workflow review</span>
          <h2>Needs Attention</h2>
          <p>Action items that may need review today.</p>
        </div>
      </div>

      <div className="needs-attention-grid">
        {items.map((item) => (
          <article className="needs-attention-card" key={item.title}>
            <div className="needs-attention-card-head">
              <span className={`needs-status ${item.statusClass || ""}`}>
                {item.status}
              </span>
              {item.meta && <span className="needs-meta">{item.meta}</span>}
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            {item.actionLabel && item.onAction && (
              <button type="button" onClick={item.onAction}>
                {item.actionLabel}
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default NeedsAttentionPanel;
