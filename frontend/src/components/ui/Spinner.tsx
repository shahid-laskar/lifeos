interface SpinnerProps {
  size?: number
  label?: string
}

export function Spinner({ size = 20, label = 'Loading' }: SpinnerProps) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
    />
  )
}
