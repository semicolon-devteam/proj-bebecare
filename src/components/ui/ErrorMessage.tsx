export default function ErrorMessage({
  message,
  type = 'error',
}: {
  message: string;
  type?: 'error' | 'warning' | 'info';
}) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-600',
    warning: 'bg-amber-50 border-amber-200 text-amber-600',
    info: 'bg-blue-50 border-blue-200 text-blue-600',
  };

  return (
    <div className={`rounded-lg border p-3 text-sm font-medium ${styles[type]}`}>
      {message}
    </div>
  );
}
