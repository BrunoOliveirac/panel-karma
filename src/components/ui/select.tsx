/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Select as SelectPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils/cn";
import {
  CheckIcon,
  ChevronDown,
  ChevronDownIcon,
  ChevronUpIcon,
  X,
} from "lucide-react";
import { ControllerRenderProps } from "react-hook-form";

interface SelectProps {
  items: any[];
  label?: string;
  bindLabel?: string;
  bindValue?: string;
  classItem?: string;
  classGroup?: string;
  placeholder?: string;
  classTrigger?: string;
  classContent?: string;
  field: ControllerRenderProps<any>;
}

function SelectWrapper({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  );
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  field,
  children,
  className,
  size = "default",
  ...props
}: { field: ControllerRenderProps } & React.ComponentProps<
  typeof SelectPrimitive.Trigger
> & {
    size?: "sm" | "default";
  }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-1.5 rounded border border-primary/40 bg-input/30 px-3 py-2 text-sm whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}

      <div className="flex justify-center items-center gap-2">
        {field.value ? (
          <span
            role="button"
            tabIndex={-1}
            className="bg-transparent border-none"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              field.onChange(null);
            }}
          >
            <X className="pointer-events-none size-4 text-muted-foreground" />
          </span>
        ) : null}

        <SelectPrimitive.Icon asChild>
          <ChevronDown className="pointer-events-none size-4 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </div>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  children,
  className,
  align = "center",
  // position = "item-aligned",
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={position === "item-aligned"}
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/5 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 rtl:data-[side=left]:translate-x-1 data-[side=right]:translate-x-1 rtl:data-[side=right]:-translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-position={position}
          className={cn(
            "data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)",
            position === "popper" && "",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2.5 rounded py-2 pe-8 ps-3 text-sm outline-hidden select-none focus:bg-primary/10 focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-primary data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute end-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownButton>
  );
}

function Select({
  field,
  items,
  bindLabel,
  bindValue,
  classItem,
  classGroup,
  placeholder,
  classContent,
  classTrigger,
}: SelectProps) {
  return (
    <SelectWrapper value={field.value} onValueChange={field.onChange}>
      <SelectTrigger className={classTrigger} field={field}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent className={classContent}>
        <SelectGroup className={classGroup}>
          {items.map((item) => (
            <SelectItem
              className={classItem}
              key={bindValue ? item[bindValue] : item}
              value={bindValue ? item[bindValue] : item}
              data-slot={`select-item-${bindValue ? item[bindValue] : item}`}
            >
              {bindLabel ? item[bindLabel] : item}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </SelectWrapper>
  );
}

export { Select };
