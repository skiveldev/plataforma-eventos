export default function StatusPanel({ state, emptyMessage, errorMessage, children }) {
  if (state === 'loading') return <p className="state" role="status">Loading…</p>;
  if (state === 'empty') return <p className="state">{emptyMessage}</p>;
  if (state === 'error') return <p className="state error" role="alert">{errorMessage}</p>;
  return children;
}
