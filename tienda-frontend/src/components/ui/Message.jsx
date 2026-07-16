export default function Message({ children, type = 'info' }) {
  if (!children) return null;
  return <div className={`message message-${type}`} role={type === 'error' ? 'alert' : 'status'}>{children}</div>;
}
