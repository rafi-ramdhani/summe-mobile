import Button from "@/components/Button";
import Input from "@/components/Input";
import {
  createFormHook,
  createFormHookContexts,
  formOptions,
} from "@tanstack/react-form";
import z from "zod";

export const { formContext, fieldContext } = createFormHookContexts();

export const { withForm, useAppForm } = createFormHook({
  formContext,
  fieldContext,
  fieldComponents: { Input },
  formComponents: { Button },
});

const loginSchema = z.object({
  email: z.email("Invalid email format").min(1, "Please enter email"),
  password: z.string().min(1, "Please enter password"),
});

export const loginOptions = formOptions({
  defaultValues: { email: "", password: "" },
  validators: { onSubmit: loginSchema },
});

const registerSchema = z
  .object({
    email: z.email("Invalid email format").min(1, "Please enter email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const registerOptions = formOptions({
  defaultValues: { email: "", password: "", confirmPassword: "" },
  validators: { onSubmit: registerSchema },
});

const forgotPasswordSchema = z.object({
  email: z.email("Invalid email format").min(1, "Please enter email"),
});

export const forgotPasswordOptions = formOptions({
  defaultValues: { email: "" },
  validators: { onSubmit: forgotPasswordSchema },
});

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const resetPasswordOptions = formOptions({
  defaultValues: { password: "", confirmPassword: "" },
  validators: { onSubmit: resetPasswordSchema },
});
