export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center w-full py-12">
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{
          borderColor: 'var(--color-green-primary)',
          borderTopColor: 'transparent',
        }}
      />
    </div>
  )
}
