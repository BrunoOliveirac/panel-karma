import React from "react";

export const richIntl = {
  strong: (chunks: React.ReactNode) => (
    <span className="font-semibold">{chunks}</span>
  ),
  italic: (chunks: React.ReactNode) => <em>{chunks}</em>,
};
