/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils/cn";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { ControllerRenderProps } from "react-hook-form";

interface ComboboxProps {
  items: any[];
  bindLabel?: string;
  bindValue?: string;
  classItem?: string;
  placeholder?: string;
  classInput?: string;
  classContent?: string;
  inputDataSlot: string;
  field: ControllerRenderProps<any>;
  emptyMessage?: string;
  showClear?: boolean;
  disabled?: boolean;
  multiple?: boolean;
}

function ComboboxWrapper({
  ...props
}: React.ComponentProps<typeof ComboboxPrimitive.Root>) {
  return <ComboboxPrimitive.Root data-slot="combobox" {...props} />;
}

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      {children}
      <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      render={<InputGroupButton variant="ghost" size="icon-xs" />}
      className={cn(className)}
      {...props}
    >
      <XIcon className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  );
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  inputDataSlot,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean;
  showClear?: boolean;
  inputDataSlot?: string;
}) {
  return (
    <InputGroup className={cn("w-auto ", className)} data-slot={inputDataSlot}>
      <ComboboxPrimitive.Input
        render={<InputGroupInput disabled={disabled} />}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            asChild
            data-slot="input-group-button"
            className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
            disabled={disabled}
          >
            <ComboboxTrigger />
          </InputGroupButton>
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  );
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset" | "anchor"
  >) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        data-slot="combobox-positioner"
        className="pointer-events-auto isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(
            "group/combobox-content relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] origin-(--transform-origin) overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/5 duration-100 data-[chips=true]:min-w-(--anchor-width) data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-start-2 data-[side=inline-start]:slide-in-from-end-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-9 *:data-[slot=input-group]:border-none *:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:shadow-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxList({
  className,
  onWheel,
  ...props
}: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        "max-h-[min(15rem,var(--available-height,100dvh))] scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0",
        className,
      )}
      onWheel={(event) => {
        // Keep wheel scrolling on the list when the combobox is portaled
        // outside a scroll-locked dialog/modal.
        onWheel?.(event);
        event.stopPropagation();
      }}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2.5 rounded-xl py-2 pe-8 ps-3 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute end-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "hidden w-full justify-center py-2 text-center text-sm text-muted-foreground group-data-empty/combobox-content:flex",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChips({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> &
  ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-4xl border border-input bg-input/30 bg-clip-padding px-2.5 py-1.5 text-sm transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-[3px] has-aria-invalid:ring-destructive/20 has-data-[slot=combobox-chip]:px-1.5 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean;
}) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "flex h-[calc(--spacing(5.5))] w-fit items-center justify-center gap-1 rounded-4xl bg-muted-foreground/10 px-2 text-xs font-medium whitespace-nowrap text-foreground has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pe-0",
        className,
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          render={<Button variant="ghost" size="icon-xs" />}
          className="-ms-1 opacity-50 hover:opacity-100"
          data-slot="combobox-chip-remove"
        >
          <XIcon className="pointer-events-none" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  );
}

function ComboboxChipsInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn("min-w-16 flex-1 outline-none", className)}
      {...props}
    />
  );
}

function Combobox({
  field,
  items,
  bindLabel,
  bindValue,
  classItem,
  placeholder,
  classContent,
  classInput,
  inputDataSlot,
  emptyMessage,
  showClear = true,
  disabled = false,
  multiple = false,
}: ComboboxProps) {
  const anchor = React.useRef<HTMLDivElement | null>(null);

  const getItemValue = React.useCallback(
    (item: any) => (bindValue ? item[bindValue] : item),
    [bindValue],
  );

  const getItemLabel = React.useCallback(
    (item: any) => (bindLabel ? item[bindLabel] : item),
    [bindLabel],
  );

  const getLabelForItem = React.useCallback(
    (item: any) => {
      if (item == null) return "";
      if (bindLabel && typeof item === "object") return String(item[bindLabel]);

      return String(item);
    },
    [bindLabel],
  );

  const itemToStringLabel = React.useCallback(
    (item: any) => getLabelForItem(item),
    [getLabelForItem],
  );

  const isItemEqualToValue = React.useCallback(
    (itemValue: any, selectedValue: any) => {
      if (selectedValue == null) return false;

      return getItemValue(itemValue) === getItemValue(selectedValue);
    },
    [getItemValue],
  );

  const rootValue = React.useMemo(() => {
    if (multiple) {
      const selectedIds = Array.isArray(field.value) ? field.value : [];
      return items.filter((item) => selectedIds.includes(getItemValue(item)));
    }

    if (field.value == null || field.value === "") return null;

    return items.find((item) => getItemValue(item) === field.value) ?? null;
  }, [field.value, getItemValue, items, multiple]);

  const hasValue = multiple
    ? Array.isArray(rootValue) && rootValue.length > 0
    : rootValue != null;

  const handleValueChange = (value: any) => {
    if (multiple) {
      field.onChange((value ?? []).map((item: any) => getItemValue(item)));
      return;
    }

    field.onChange(value != null ? getItemValue(value) : null);
  };

  const listContent = (
    <ComboboxList>
      {(item) => (
        <ComboboxItem
          className={classItem}
          key={getItemValue(item)}
          value={item}
          data-slot={`combobox-item-${getItemValue(item)}`}
        >
          {getItemLabel(item)}
        </ComboboxItem>
      )}
    </ComboboxList>
  );

  const itemMappingProps = bindValue
    ? { itemToStringLabel, isItemEqualToValue }
    : {};

  if (multiple) {
    return (
      <ComboboxWrapper
        multiple
        items={items}
        disabled={disabled}
        value={rootValue}
        onValueChange={handleValueChange}
        {...itemMappingProps}
      >
        <ComboboxChips
          ref={anchor}
          data-slot={inputDataSlot}
          className={cn(
            "bg-input/30 border-primary/40 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-9 rounded border px-3 py-1 text-base transition-colors file:h-7 file:text-sm file:font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "data-[invalid=true]:border-red-900 data-[invalid=true]:ring-red-900",
            classInput,
          )}
        >
          <ComboboxValue>
            {(values: any[]) => (
              <>
                {values.map((item) => (
                  <ComboboxChip key={getItemValue(item)}>
                    {getLabelForItem(item)}
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput
                  placeholder={placeholder}
                  disabled={disabled}
                />
              </>
            )}
          </ComboboxValue>

          {showClear && hasValue ? <ComboboxClear disabled={disabled} /> : null}
        </ComboboxChips>

        <ComboboxContent anchor={anchor} className={classContent}>
          {emptyMessage ? <ComboboxEmpty>{emptyMessage}</ComboboxEmpty> : null}
          {listContent}
        </ComboboxContent>
      </ComboboxWrapper>
    );
  }

  return (
    <ComboboxWrapper
      items={items}
      value={rootValue}
      onValueChange={handleValueChange}
      disabled={disabled}
      {...itemMappingProps}
    >
      <ComboboxInput
        placeholder={placeholder}
        className={classInput}
        inputDataSlot={inputDataSlot}
        showClear={showClear && hasValue}
        disabled={disabled}
      />

      <ComboboxContent className={classContent}>
        {emptyMessage ? <ComboboxEmpty>{emptyMessage}</ComboboxEmpty> : null}
        {listContent}
      </ComboboxContent>
    </ComboboxWrapper>
  );
}

export { Combobox };
