import React, { forwardRef } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onIncrement?: () => void
  onDecrement?: () => void
  showSpinners?: boolean
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, onIncrement, onDecrement, showSpinners = true, ...props }, ref) => {
    const handleIncrement = () => {
      if (onIncrement) {
        onIncrement()
      } else if (ref && 'current' in ref && ref.current) {
        const input = ref.current
        const currentValue = parseFloat(input.value) || 0
        const step = parseFloat(input.step) || 1
        input.value = (currentValue + step).toString()
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }

    const handleDecrement = () => {
      if (onDecrement) {
        onDecrement()
      } else if (ref && 'current' in ref && ref.current) {
        const input = ref.current
        const currentValue = parseFloat(input.value) || 0
        const step = parseFloat(input.step) || 1
        const min = parseFloat(input.min) || -Infinity
        const newValue = Math.max(min, currentValue - step)
        input.value = newValue.toString()
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }

    return (
      <div className="number-input-container relative">
        <Input
          type="number"
          className={cn(showSpinners && "pr-8", className)}
          ref={ref}
          {...props}
        />
        {showSpinners && (
          <div className="spinner-arrows">
            <button
              type="button"
              className="spinner-arrow"
              onClick={handleIncrement}
              tabIndex={-1}
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              type="button"
              className="spinner-arrow"
              onClick={handleDecrement}
              tabIndex={-1}
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    )
  }
)

NumberInput.displayName = "NumberInput"

export { NumberInput }