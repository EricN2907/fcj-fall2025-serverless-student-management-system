import { NumberInput as ChakraNumberInput, HStack, IconButton } from '@chakra-ui/react'
import { forwardRef } from 'react'
import { LuMinus, LuPlus } from 'react-icons/lu'

export interface NumberInputProps extends ChakraNumberInput.RootProps {
  placeholder?: string
}

export const NumberInputRoot = forwardRef<HTMLDivElement, NumberInputProps>(
  function NumberInputRoot(props, ref) {
    const { children, ...rest } = props
    return (
      <ChakraNumberInput.Root ref={ref} {...rest}>
        {children}
        <ChakraNumberInput.Control>
          <ChakraNumberInput.IncrementTrigger />
          <ChakraNumberInput.DecrementTrigger />
        </ChakraNumberInput.Control>
      </ChakraNumberInput.Root>
    )
  }
)

export const NumberInputField = ChakraNumberInput.Input

export const NumberInputStepper = forwardRef<HTMLDivElement, ChakraNumberInput.ControlProps>(
  function NumberInputStepper(props, ref) {
    return (
      <ChakraNumberInput.Control ref={ref} {...props}>
        <ChakraNumberInput.IncrementTrigger />
        <ChakraNumberInput.DecrementTrigger />
      </ChakraNumberInput.Control>
    )
  }
)

// Simple inline number input with +/- buttons
interface InlineNumberInputProps {
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  onSave?: () => void
  onCancel?: () => void
}

export const InlineNumberInput = forwardRef<HTMLInputElement, InlineNumberInputProps>(
  function InlineNumberInput(props, ref) {
    const { value, onChange, min = 0, max = 10, step = 0.5, onSave, onCancel } = props
    
    return (
      <ChakraNumberInput.Root
        size='sm'
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(details) => onChange(details.value)}
        w='100px'
      >
        <ChakraNumberInput.Input
          ref={ref}
          borderColor='orange.300'
          bg='white'
          borderRadius='md'
          _focus={{ 
            borderColor: '#dd7323', 
            boxShadow: '0 0 0 2px rgba(221, 115, 35, 0.2)' 
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSave) onSave()
            if (e.key === 'Escape' && onCancel) onCancel()
          }}
        />
        <ChakraNumberInput.Control>
          <ChakraNumberInput.IncrementTrigger />
          <ChakraNumberInput.DecrementTrigger />
        </ChakraNumberInput.Control>
      </ChakraNumberInput.Root>
    )
  }
)

export const NumberInput = ChakraNumberInput
