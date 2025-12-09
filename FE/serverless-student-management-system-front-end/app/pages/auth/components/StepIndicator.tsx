import { Box, HStack } from '@chakra-ui/react'

type Step = 'email' | 'verify' | 'newPassword' | 'success'

interface StepIndicatorProps {
  currentStep: Step
}

const STEPS: Step[] = ['email', 'verify', 'newPassword']

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.indexOf(currentStep)

  return (
    <HStack gap={2} justify="center" mb={6}>
      {STEPS.map((s, index) => (
        <Box
          key={s}
          w={currentStep === s ? '24px' : '8px'}
          h="8px"
          borderRadius="full"
          bg={
            currentStep === s
              ? '#dd7323'
              : currentIndex > index
                ? '#dd7323'
                : 'gray.300'
          }
          transition="all 0.3s"
        />
      ))}
    </HStack>
  )
}
