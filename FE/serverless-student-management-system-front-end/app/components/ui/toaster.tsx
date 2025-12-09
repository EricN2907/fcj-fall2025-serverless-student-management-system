import { createToaster, Toaster as ChakraToaster, Toast, Box, HStack } from '@chakra-ui/react'
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react'

export const toaster = createToaster({
  placement: 'bottom-end',
  pauseOnPageIdle: true,
  overlap: true,
  gap: 16,
})

export function Toaster() {
  return (
    <ChakraToaster toaster={toaster}>
      {(toast) => {
        const getColorScheme = () => {
          switch (toast.type) {
            case 'success': return { bg: 'green.500', iconColor: 'white' }
            case 'error': return { bg: 'red.500', iconColor: 'white' }
            case 'warning': return { bg: 'orange.500', iconColor: 'white' }
            case 'info': return { bg: 'blue.600', iconColor: 'white' }
            default: return { bg: 'gray.600', iconColor: 'white' }
          }
        }

        const getIcon = () => {
          const colors = getColorScheme()
          const iconProps = { size: 20, color: colors.iconColor }
          
          switch (toast.type) {
            case 'success': return <CheckCircle2 {...iconProps} />
            case 'error': return <XCircle {...iconProps} />
            case 'warning': return <AlertCircle {...iconProps} />
            case 'info': return <Info {...iconProps} />
            default: return null
          }
        }

        const colorScheme = getColorScheme()

        return (
          <Toast.Root
            position="relative"
            bg={colorScheme.bg}
            color="white"
            p="3.5"
            pr="12"
            borderRadius="lg"
            boxShadow="2xl"
            minW="400px"
            maxW="500px"
            zIndex={9999}
            pointerEvents="auto"
          >
            <HStack gap="3" align="flex-start">
              <Box flexShrink={0} display="flex" alignItems="center" mt="0.5">
                {getIcon()}
              </Box>
              
              <Box flex="1">
                {toast.title && (
                  <Toast.Title 
                    fontWeight="semibold" 
                    fontSize="md"
                    mb={toast.description ? '1' : '0'}
                    color="white"
                    lineHeight="1.4"
                  >
                    {toast.title}
                  </Toast.Title>
                )}
                {toast.description && (
                  <Toast.Description 
                    fontSize="sm" 
                    opacity={0.95}
                    lineHeight="1.5"
                    color="white"
                  >
                    {toast.description}
                  </Toast.Description>
                )}
              </Box>
            </HStack>

            <Toast.CloseTrigger
              position="absolute"
              top="3"
              right="3"
              bg="whiteAlpha.200"
              borderRadius="md"
              w="5"
              h="5"
              color="white"
              fontSize="sm"
              transition="all 0.2s"
              _hover={{
                bg: 'whiteAlpha.300',
                transform: 'scale(1.1)',
              }}
              _active={{
                transform: 'scale(0.95)',
              }}
            />
          </Toast.Root>
        )
      }}
    </ChakraToaster>
  )
}


