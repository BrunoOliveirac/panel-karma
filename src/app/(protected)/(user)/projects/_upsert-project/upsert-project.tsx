"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { SpinnerButton } from "@/components/ui/spinner-button";
import { Switch } from "@/components/ui/switch";
import { Client } from "@/lib/models/client";
import { Project } from "@/lib/models/project";
import { ModalInjectedProps } from "@/lib/providers/modal-provider";
import { ClientService } from "@/lib/services/client.service";
import { ProjectService } from "@/lib/services/project.service";
import { upsertProjectValidator } from "@/lib/validators/upsert-project.validator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

interface UpsertForm {
  name: string;
  active: boolean;
  clientId: string;
}

export default function UpsertProject({
  project,
  closeModal,
  dismissModal,
}: { project?: Project } & ModalInjectedProps<boolean>) {
  const sharedT = useTranslations("shared");
  const t = useTranslations("upsert_project");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const projectService = useMemo(() => new ProjectService(), []);
  const clientService = useMemo(() => new ClientService(), []);

  const {
    control,
    setValue,
    handleSubmit,
  }: UseFormReturn<UpsertForm, unknown, UpsertForm> = useForm({
    resolver: zodResolver(upsertProjectValidator(useTranslations())),
    defaultValues: { name: "", active: true, clientId: "" },
    mode: "onChange",
  });

  useEffect(() => {
    const loadClients = async () => {
      try {
        const loadedClients = await clientService.getAllClients();
        setClients(loadedClients);

        if (project) {
          setValue("name", project.name);
          setValue("active", project.active);

          if (project.client) setValue("clientId", project.client.id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [project, clientService, setValue]);

  /**
   * Submit the form and create or update the project.
   * @param data The form data.
   */
  const onSubmit = async (data: UpsertForm) => {
    try {
      setSubmitting(true);
      const projectData = { ...project, ...data, id: project?.id } as Project;
      const projectId = await projectService.upsertProject(projectData);
      const selectedClient = clients.find((client) => client.id === data.clientId);

      const upsertedProject: Project = {
        ...(project ?? {}),
        name: data.name,
        active: data.active,
        id: projectId,
        client: selectedClient ?? project?.client,
        createdAt: project?.createdAt ?? new Date(),
      } as Project;

      toast.success(t(`project_${project ? "updated" : "created"}`));
      dismissModal(upsertedProject);
    } catch (error) {
      console.error(error);
      toast.error(t(`could_not_${project ? "update" : "create"}`));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <section data-slot="upsert-project-modal">
      <p className="text-xl font-medium mb-8">{t("project_details")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>{sharedT("name")}</FieldLabel>

              <Input
                {...field}
                data-slot="upsert-project-name"
                data-invalid={fieldState.invalid}
                placeholder={sharedT("enter_name")}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="clientId"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>{t("client")}</FieldLabel>

              <Select
                field={field}
                bindValue="id"
                items={clients}
                bindLabel="name"
                placeholder={t("select_client")}
                triggerDataSlot="upsert-project-client-trigger"
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="active"
          control={control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                data-slot="upsert-project-active"
              />

              <FieldLabel>{t("status")}</FieldLabel>
            </Field>
          )}
        />

        <div className="flex justify-end items-center gap-6 mt-8">
          <Field className="w-fit">
            <Button
              size="lg"
              type="button"
              disabled={submitting}
              onClick={() => closeModal()}
              data-slot="upsert-project-cancel"
              className="max-w-28 rounded bg-transparent border border-primary/40 cursor-pointer not-hover:text-primary"
            >
              {sharedT("cancel")}
            </Button>
          </Field>

          <Field className="w-fit">
            <SpinnerButton
              size="lg"
              type="submit"
              loading={submitting}
              dataSlot="upsert-project-save"
              className="max-w-28 rounded bg-transparent border border-primary/40 cursor-pointer not-hover:text-primary"
            >
              {sharedT("save")}
            </SpinnerButton>
          </Field>
        </div>
      </form>
    </section>
  );
}
