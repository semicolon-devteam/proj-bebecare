export default function LoadingSpinner({ text = '로딩 중...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-dusty-rose border-t-transparent" />
      {text && <span className="text-sm text-gray-500">{text}</span>}
    </div>
  );
}
