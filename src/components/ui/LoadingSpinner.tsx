const SIZES = {
  sm: { spinner: 'h-4 w-4 border-2', text: 'text-sm' },
  md: { spinner: 'h-8 w-8 border-[3px]', text: 'text-base' },
  lg: { spinner: 'h-12 w-12 border-4', text: 'text-lg' },
} as const;

type SpinnerSize = keyof typeof SIZES;

export default function LoadingSpinner({
  text = '로딩 중...',
  size = 'sm',
}: {
  text?: string;
  size?: SpinnerSize;
}) {
  const s = SIZES[size];
  return (
    <div className="flex items-center justify-center gap-2">
      <div className={`${s.spinner} animate-spin rounded-full border-dusty-rose border-t-transparent`} />
      {text && <span className={`${s.text} text-gray-500`}>{text}</span>}
    </div>
  );
}
