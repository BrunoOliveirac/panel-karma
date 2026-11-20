import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { SpinnerButton } from "../ui/spinner-button";
import { useMemo, useState } from "react";
import { ModalInjectedProps } from "@/lib/providers/modal-provider";
import { TicketService } from "@/lib/services/ticket.service";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, UseFormReturn } from "react-hook-form";
import { startSupportValidator } from "@/lib/validators/start-support.validator";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

interface StartSupportForm {
  title: string;
  description: string;
}

export default function StartSupportModal({
  closeModal,
  dismissModal,
}: ModalInjectedProps<boolean>) {
  const sharedT = useTranslations("shared");
  const sidebarT = useTranslations("sidebar");
  const [submitting, setSubmitting] = useState(false);
  const startSupportT = useTranslations("start_support");
  const ticketService = useMemo(() => new TicketService(), []);

  const {
    control,
    handleSubmit,
  }: UseFormReturn<StartSupportForm, unknown, StartSupportForm> = useForm({
    resolver: zodResolver(startSupportValidator(useTranslations())),
    defaultValues: { title: "", description: "" },
    mode: "onChange",
  });

  /**
   * Submit the form and create or update the sector.
   * @param data The form data.
   */
  const onSubmit = async (startSupportForm: StartSupportForm) => {
    try {
      setSubmitting(true);
      await ticketService.createTicket(startSupportForm);
      toast.success(startSupportT("support_created"));
      dismissModal(true);
    } catch (error) {
      console.error(error);
      toast.error(startSupportT("could_not_start_support"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section data-slot="start-support-modal">
      <p className="text-xl font-medium mb-8">{sidebarT("start_support")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Controller
          name="title"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>{startSupportT("title")}</FieldLabel>

              <Input
                {...field}
                data-slot="start-support-title"
                data-invalid={fieldState.invalid}
                placeholder={startSupportT("enter_title")}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>{startSupportT("description")}</FieldLabel>

              <Textarea
                rows={5}
                {...field}
                data-invalid={fieldState.invalid}
                data-slot="start-support-description"
                placeholder={startSupportT("enter_description")}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="flex justify-end items-center gap-6 mt-8">
          <Button
            size="lg"
            type="button"
            disabled={submitting}
            onClick={() => closeModal()}
            data-slot="start-support-cancel"
            className="max-w-28 rounded bg-transparent text-black dark:text-white cursor-pointer hover:text-white dark:hover:text-black hover:bg-black dark:hover:bg-white"
          >
            {sharedT("cancel")}
          </Button>

          <SpinnerButton
            size="lg"
            type="submit"
            loading={submitting}
            dataSlot="start-support-save"
            className="max-w-28 rounded bg-transparent border border-primary/40 cursor-pointer not-hover:text-primary"
          >
            {sharedT("save")}
          </SpinnerButton>
        </div>
      </form>
    </section>
  );
}
