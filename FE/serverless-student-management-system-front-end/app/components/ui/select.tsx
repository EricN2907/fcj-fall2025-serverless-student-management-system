import { Select as ChakraSelect, Portal, Spinner, IconButton } from "@chakra-ui/react"
import { forwardRef } from "react"
import { LuX } from "react-icons/lu"

interface SelectTriggerProps extends ChakraSelect.ControlProps {
  clearable?: boolean
  loading?: boolean
}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger(props, ref) {
    const { children, clearable, loading, ...rest } = props
    return (
      <ChakraSelect.Control {...rest}>
        <ChakraSelect.Trigger ref={ref}>{children}</ChakraSelect.Trigger>
        <ChakraSelect.IndicatorGroup>
          {loading && <Spinner size="xs" borderWidth="1.5px" color="fg.muted" />}
          {clearable && !loading && <SelectClearTrigger />}
          <ChakraSelect.Indicator />
        </ChakraSelect.IndicatorGroup>
      </ChakraSelect.Control>
    )
  },
)

const SelectClearTrigger = forwardRef<HTMLButtonElement, ChakraSelect.ClearTriggerProps>(
  function SelectClearTrigger(props, ref) {
    return (
      <ChakraSelect.ClearTrigger asChild {...props} ref={ref}>
        <IconButton variant="ghost" aria-label="Close">
          <LuX />
        </IconButton>
      </ChakraSelect.ClearTrigger>
    )
  },
)

interface SelectContentProps extends ChakraSelect.ContentProps {
  portalled?: boolean
  portalRef?: React.RefObject<HTMLElement>
}

export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
  function SelectContent(props, ref) {
    const { portalled = true, portalRef, ...rest } = props
    return (
      <Portal disabled={!portalled} container={portalRef}>
        <ChakraSelect.Positioner>
          <ChakraSelect.Content 
            {...rest} 
            ref={ref}
            bg="white"
            borderRadius="md"
            borderWidth="1px"
            borderColor="gray.200"
            boxShadow="lg"
            py="1"
            maxH="300px"
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#CBD5E0',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#A0AEC0',
              },
            }}
          >
            {props.children}
          </ChakraSelect.Content>
        </ChakraSelect.Positioner>
      </Portal>
    )
  },
)

export const SelectItem = forwardRef<HTMLDivElement, ChakraSelect.ItemProps>(
  function SelectItem(props, ref) {
    const { item, children, ...rest } = props
    return (
      <ChakraSelect.Item 
        key={item.value} 
        item={item} 
        {...rest} 
        ref={ref}
        px="3"
        py="2"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{
          bg: "gray.100",
        }}
        _highlighted={{
          bg: "blue.50",
        }}
        _selected={{
          bg: "blue.100",
          fontWeight: "semibold",
        }}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        fontSize="sm"
      >
        {children}
        <ChakraSelect.ItemIndicator color="blue.600" />
      </ChakraSelect.Item>
    )
  },
)

export const SelectValueText = forwardRef<
  HTMLSpanElement,
  ChakraSelect.ValueTextProps
>(function SelectValueText(props, ref) {
  const { children, ...rest } = props
  return (
    <ChakraSelect.ValueText {...rest} ref={ref}>
      <ChakraSelect.Context>
        {(select) => {
          const items = select.selectedItems
          if (items.length === 0) return props.placeholder
          if (items.length === 1)
            return select.collection.stringifyItem(items[0])
          return `${items.length} selected`
        }}
      </ChakraSelect.Context>
    </ChakraSelect.ValueText>
  )
})

export const SelectRoot = ChakraSelect.Root
export const SelectItemGroup = ChakraSelect.ItemGroup
export const SelectItemGroupLabel = ChakraSelect.ItemGroupLabel
export const SelectLabel = ChakraSelect.Label
export const SelectItemText = ChakraSelect.ItemText
