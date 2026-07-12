"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import React from "react";

export interface SubmitButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode;
  loadingText?: string;
  icon?: React.ReactNode;
}

export function SubmitButton({
  children,
  loadingText,
  icon,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending || disabled} {...props}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || "Loading..."}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </Button>
  );
}
