import React from "react";
import "./VerticalGraph.css";

export function VerticalGraph({ data }) {
  const values = data.datasets[0].data;
  const maxValue = Math.max(...values, 1);
  const axisMaximum = Math.ceil(maxValue / 1000) * 1000;
  const axisTicks = Array.from({ length: 6 }, (_, index) => axisMaximum - (axisMaximum / 5) * index);

  if (!data.labels.length) {
    return <p className="vertical-graph__empty">No holding data available to chart.</p>;
  }

  return (
    <div className="vertical-graph">
      <h4 className="vertical-graph__title">Holdings</h4>
      <div className="vertical-graph__legend">
        <span className="vertical-graph__legend-swatch" />
        <span>Stock Name</span>
      </div>
      <div className="vertical-graph__scroll">
        <div className="vertical-graph__plot">
          <div className="vertical-graph__axis" aria-hidden="true">
            {axisTicks.map((tick, index) => <span key={index}>{Math.round(tick).toLocaleString("en-IN")}</span>)}
          </div>
          <div className="vertical-graph__bars" role="img" aria-label="Bar chart showing stock prices for each holding">
        {data.labels.map((label, index) => (
          <div
            className="vertical-graph__item"
            key={`${label}-${index}`}
            title={`${label} | Price: ₹${Number(values[index]).toFixed(2)}`}
            aria-label={`${label}, price ₹${Number(values[index]).toFixed(2)}`}
          >
            <div className="vertical-graph__track">
              <div className="vertical-graph__bar" style={{ height: `${Math.max((values[index] / axisMaximum) * 100, 1)}%` }} />
            </div>
            <span className="vertical-graph__label">{label}</span>
          </div>
        ))}
          </div>
        </div>
      </div>
    </div>
  );
}
