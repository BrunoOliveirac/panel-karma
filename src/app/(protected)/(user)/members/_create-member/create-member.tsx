"use client";

import PasswordFields from "@/components/global/password-fields";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { SpinnerButton } from "@/components/ui/spinner-button";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { Member } from "@/lib/models/member";
import { Project } from "@/lib/models/project";
import { ModalInjectedProps } from "@/lib/providers/modal-provider";
import { MemberService } from "@/lib/services/member.service";
import { ProjectService } from "@/lib/services/project.service";
import {
  CreateMemberForm,
  createMemberValidator,
} from "@/lib/validators/create-member.validator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

export default function CreateMember({
  closeModal,
  dismissModal,
}: ModalInjectedProps<boolean>) {
  const sharedT = useTranslations("shared");
  const t = useTranslations("create_member");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const memberService = useMemo(() => new MemberService(), []);
  const projectService = useMemo(() => new ProjectService(), []);

  const {
    control,
    handleSubmit,
  }: UseFormReturn<CreateMemberForm, unknown, CreateMemberForm> = useForm({
    resolver: zodResolver(createMemberValidator(useTranslations())),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      projectIds: [],
      confirmPassword: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const activeProjects = await projectService.getAllActiveProjects();
        setProjects(activeProjects);
      } catch (error) {
        console.error(error);
        toast.error(t("could_not_load"));
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [projectService, t]);

  const validateEmail = async (email: string): Promise<boolean> => {
    try {
      if (!email) return false;
      const isValidEmail = /.+@.+\..+/.test(email);

      if (!isValidEmail) {
        toast.error(t("format_is_not_valid"));
        return false;
      }

      const formattedEmail = email.trim().toLowerCase();
      const isValid = await memberService.checkEmail(formattedEmail);

      if (!isValid) toast.error(t("email_in_use"));

      return isValid;
    } catch (error) {
      console.error(error);
      toast.error(t("format_is_not_valid"));
      return false;
    }
  };

  const onSubmit = async (data: CreateMemberForm) => {
    try {
      setSubmitting(true);
      const emailIsValid = await validateEmail(data.email);
      if (!emailIsValid) return;

      const payload: Partial<Member> & { password?: string } = {
        active: true,
        name: data.name,
        password: data.password,
        email: data.email.trim().toLowerCase(),
      };

      const memberId = await memberService.createMember(payload);

      if (data.projectIds?.length) {
        await memberService.updateMemberProjects(memberId, data.projectIds);
      }

      toast.success(t("member_created"));

      dismissModal({
        id: memberId,
        active: true,
        name: data.name,
        email: data.email.trim().toLowerCase(),
        type: UserTypeEnum.MEMBER,
        createdAt: new Date(),
      } as Member);
    } catch (error) {
      console.error(error);
      toast.error(t("could_not_create"));
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
    <section data-slot="create-member-modal">
      <p className="text-xl font-medium mb-8">{t("member_details")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>{sharedT("name")}</FieldLabel>

              <Input
                {...field}
                data-slot="create-member-name"
                data-invalid={fieldState.invalid}
                placeholder={sharedT("enter_name")}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>{t("email")}</FieldLabel>

              <Input
                {...field}
                type="email"
                data-slot="create-member-email"
                data-invalid={fieldState.invalid}
                placeholder={t("enter_email")}
                onBlur={(e) => validateEmail(e.target.value)}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="projectIds"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>{t("projects")}</FieldLabel>

              <Combobox
                multiple
                showClear
                field={field}
                bindValue="id"
                bindLabel="name"
                items={projects}
                placeholder={t("select_projects")}
                emptyMessage={t("projects_not_found")}
                inputDataSlot="create-member-projects"
              />
            </Field>
          )}
        />

        <PasswordFields
          control={control}
          passwordDataSlot="create-member-password"
          confirmPasswordDataSlot="create-member-confirm-password"
        />

        <div className="flex justify-end items-center gap-6 mt-8">
          <Field className="w-fit">
            <Button
              size="lg"
              type="button"
              disabled={submitting}
              onClick={() => closeModal()}
              data-slot="create-member-cancel"
              className="max-w-28 rounded bg-transparent text-black dark:text-white cursor-pointer hover:text-white dark:hover:text-black hover:bg-black dark:hover:bg-white"
            >
              {sharedT("cancel")}
            </Button>
          </Field>

          <Field className="w-fit">
            <SpinnerButton
              size="lg"
              type="submit"
              loading={submitting}
              dataSlot="create-member-save"
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
