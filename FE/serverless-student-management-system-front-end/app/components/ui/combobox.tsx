import { Combobox as ChakraCombobox, Portal } from "@chakra-ui/react"
import * as React from "react"

interface ComboboxItemProps extends ChakraCombobox.ItemProps {
  item: any
  children?: React.ReactNode
}

export const ComboboxItem = React.forwardRef<HTMLDivElement, ComboboxItemProps>(
  function ComboboxItem(props, ref) {
    const { item, children, ...rest } = props
    return (
      <ChakraCombobox.Item key={item.value} item={item} ref={ref} {...rest}>
        {children}
        <ChakraCombobox.ItemIndicator />
      </ChakraCombobox.Item>
    )
  },
)

export const ComboboxItemText = ChakraCombobox.ItemText

interface ComboboxContentProps extends ChakraCombobox.ContentProps {
  portalled?: boolean
  portalRef?: React.RefObject<HTMLElement>
}

export const ComboboxContent = React.forwardRef<
  HTMLDivElement,
  ComboboxContentProps
>(function ComboboxContent(props, ref) {
  const { portalled = true, portalRef, ...rest } = props
  return (
    <Portal disabled={!portalled} container={portalRef}>
      <ChakraCombobox.Positioner>
        <ChakraCombobox.Content {...rest} ref={ref} />
      </ChakraCombobox.Positioner>
    </Portal>
  )
})

export const ComboboxRoot = ChakraCombobox.Root
export const ComboboxClearTrigger = ChakraCombobox.ClearTrigger
export const ComboboxControl = ChakraCombobox.Control
export const ComboboxInput = ChakraCombobox.Input
export const ComboboxTrigger = ChakraCombobox.Trigger
export const ComboboxLabel = ChakraCombobox.Label
export const ComboboxItemGroup = ChakraCombobox.ItemGroup
