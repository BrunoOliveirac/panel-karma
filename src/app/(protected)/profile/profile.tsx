"use client";

import { ImageCropDialog } from "@/components/global/image-crop-dialog";
import PasswordFields from "@/components/global/password-fields";
import UserAvatar from "@/components/global/user-avatar";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SpinnerButton } from "@/components/ui/spinner-button";
import { useAuth } from "@/lib/hooks/use-auth";
import { ProfileService } from "@/lib/services/profile.service";
import { useLoggedUserStore } from "@/lib/store/use-logged-user-store";
import { useTitle } from "@/lib/store/use-title-store";
import {
  ProfileForm,
  profileValidator,
} from "@/lib/validators/profile.validator";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, UseFormReturn, useWatch } from "react-hook-form";
import { toast } from "sonner";

export default function Profile() {
  const t = useTranslations("profile");
  const sharedT = useTranslations("shared");
  const registerT = useTranslations("register");
  const { data } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const setTitle = useTitle((state) => state.setTitle);
  const profileService = useMemo(() => new ProfileService(), []);
  const user = data?.user;

  const {
    control,
    reset,
    getValues,
    handleSubmit,
  }: UseFormReturn<ProfileForm, unknown, ProfileForm> = useForm({
    resolver: zodResolver(profileValidator(useTranslations())),
    defaultValues: {
      name: "",
      email: "",
      avatar: null,
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const avatar = useWatch({ control, name: "avatar" });
  const name = useWatch({ control, name: "name", defaultValue: "" });
  const email = useWatch({ control, name: "email", defaultValue: "" });

  useEffect(() => setTitle(t("profile")), [setTitle, t]);

  useEffect(() => {
    if (!user) return;

    reset({
      name: user.name,
      email: user.email,
      avatar: user.avatar ?? null,
      password: "",
      confirmPassword: "",
    });
  }, [user, reset]);

  useEffect(() => {
    return () => {
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    };
  }, [cropImageSrc]);

  /**
   * Sync auth cache and form after a successful profile update.
   */
  const applyUpdatedUser = (updatedUser: NonNullable<typeof user>): void => {
    useLoggedUserStore.getState().setUser(updatedUser);

    queryClient.setQueryData(
      ["auth"],
      (current: { user: typeof updatedUser; locale: string } | undefined) =>
        current ? { ...current, user: updatedUser } : current,
    );

    reset({
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar ?? null,
      password: "",
      confirmPassword: "",
    });
  };

  /**
   * Close the crop dialog and release the temporary object URL.
   */
  const closeCropDialog = (): void => {
    setCropImageSrc((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  };

  /**
   * Open the crop dialog with the selected image.
   */
  const onAvatarChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("invalid_image"));
      return;
    }

    setCropImageSrc((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  /**
   * Persist the cropped avatar immediately.
   */
  const onConfirmCrop = async (dataUrl: string): Promise<void> => {
    if (!user) return;

    try {
      const values = getValues();

      const updatedUser = await profileService.updateProfile({
        name: values.name || user.name,
        email: (values.email || user.email).trim().toLowerCase(),
        avatar: dataUrl,
      });

      applyUpdatedUser(updatedUser);
      closeCropDialog();
      toast.success(t("avatar_updated"));
    } catch (error) {
      console.error(error);
      toast.error(t("could_not_update_avatar"));
    }
  };

  /**
   * Remove the avatar from the profile and persist the change.
   */
  const onRemoveAvatar = async (): Promise<void> => {
    if (!user || removingAvatar) return;

    try {
      setRemovingAvatar(true);
      const values = getValues();

      const updatedUser = await profileService.updateProfile({
        name: values.name || user.name,
        email: (values.email || user.email).trim().toLowerCase(),
        avatar: "",
      });

      applyUpdatedUser(updatedUser);
      toast.success(t("avatar_removed"));
    } catch (error) {
      console.error(error);
      toast.error(t("could_not_remove_avatar"));
    } finally {
      setRemovingAvatar(false);
    }
  };

  /**
   * Persist profile changes for the authenticated user only.
   */
  const onSubmit = async (formData: ProfileForm): Promise<void> => {
    try {
      setSubmitting(true);

      const updatedUser = await profileService.updateProfile({
        name: formData.name,
        email: formData.email.trim().toLowerCase(),
        avatar: formData.avatar || "",
        ...(formData.password ? { password: formData.password } : {}),
      });

      applyUpdatedUser(updatedUser);
      toast.success(t("profile_updated"));
    } catch (error) {
      console.error(error);
      toast.error(t("could_not_update"));
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = name || user?.name || "?";
  const displayEmail = email || user?.email || "";

  return (
    <div className="flex-1 overflow-auto pb-10">
      <div className="mx-auto w-full max-w-5xl space-y-5 px-1">
        <div>
          <p className="text-lg font-medium">{t("manage_profile")}</p>

          <p className="mt-1 text-sm text-muted-foreground">
            {t("manage_profile_description")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-5 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:items-start"
          data-slot="profile-form"
        >
          <aside className="overflow-hidden rounded-xl border border-primary/30 bg-[#f7f7f7] shadow-sm dark:bg-[#111] lg:sticky lg:top-2">
            <div
              aria-hidden
              className="h-24 bg-linear-to-br from-primary/30 via-primary/10 to-(--info)/25"
            />

            <div className="relative -mt-12 flex flex-col items-center gap-4 px-5 pb-6 text-center">
              <button
                type="button"
                aria-label={t("change_avatar")}
                data-slot="profile-avatar-trigger"
                onClick={() => fileInputRef.current?.click()}
                className="group relative rounded-full bg-[#f7f7f7] p-1 shadow-md ring-1 ring-primary/25 transition hover:ring-primary/50 dark:bg-[#111]"
              >
                <UserAvatar
                  size={112}
                  avatar={avatar}
                  name={displayName}
                  className="ring-2 ring-background"
                />

                <span className="absolute inset-x-0 bottom-1 mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-primary to-(--info) text-white shadow-md ring-2 ring-[#f7f7f7] transition group-hover:brightness-110 dark:ring-[#111]">
                  <Camera size={14} />
                </span>
              </button>

              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={onAvatarChange}
                data-slot="profile-avatar-input"
                accept="image/png,image/jpeg,image/webp"
              />

              <div className="w-full min-w-0 space-y-1">
                <p className="truncate text-lg font-medium">{displayName}</p>

                {displayEmail && (
                  <p className="truncate text-sm text-muted-foreground">
                    {displayEmail}
                  </p>
                )}
              </div>

              <p className="text-xs text-muted-foreground sm:text-sm">
                {t("avatar_hint")}
              </p>

              <div className="flex w-full flex-col gap-2">
                <button
                  type="button"
                  data-slot="profile-avatar-upload"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 w-full rounded-full bg-linear-to-br from-primary to-(--info) px-3.5 text-sm text-white transition hover:brightness-90"
                >
                  {t("upload_avatar")}
                </button>

                {avatar && (
                  <button
                    type="button"
                    onClick={onRemoveAvatar}
                    disabled={removingAvatar}
                    data-slot="profile-avatar-remove"
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-destructive/40 px-3.5 text-sm text-destructive transition hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    {t("remove_avatar")}
                  </button>
                )}
              </div>
            </div>
          </aside>

          <div className="overflow-hidden rounded-xl border border-primary/30 bg-[#f7f7f7] shadow-sm dark:bg-[#111]">
            <div className="space-y-8 p-6 sm:p-8">
              <section className="space-y-4">
                <div>
                  <p className="text-sm font-medium">{t("personal_details")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("personal_details_hint")}
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Controller
                    name="name"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>{sharedT("name")}</FieldLabel>

                        <Input
                          {...field}
                          data-slot="profile-name"
                          data-invalid={fieldState.invalid}
                          placeholder={sharedT("enter_name")}
                        />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="email"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>{registerT("email")}</FieldLabel>

                        <Input
                          {...field}
                          type="email"
                          data-slot="profile-email"
                          data-invalid={fieldState.invalid}
                          placeholder={registerT("enter_email")}
                        />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </section>

              <Separator className="bg-primary/15" />

              <section className="space-y-4">
                <div>
                  <p className="text-sm font-medium">{t("password_section")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("password_section_hint")}
                  </p>
                </div>

                <div className="space-y-4">
                  <PasswordFields
                    optional
                    control={control}
                    passwordDataSlot="profile-password"
                    confirmPasswordDataSlot="profile-confirm-password"
                  />
                </div>
              </section>
            </div>

            <div className="flex items-center justify-end border-t border-primary/15 bg-background/40 px-6 py-4 sm:px-8">
              <SpinnerButton
                size="lg"
                type="submit"
                loading={submitting}
                dataSlot="profile-save"
                className="min-w-32 cursor-pointer rounded border border-primary/40 bg-transparent not-hover:text-primary"
              >
                {sharedT("save")}
              </SpinnerButton>
            </div>
          </div>
        </form>
      </div>

      <ImageCropDialog
        shape="round"
        open={!!cropImageSrc}
        imageSrc={cropImageSrc}
        title={t("crop_avatar")}
        onConfirm={onConfirmCrop}
        dataSlot="profile-crop-dialog"
        zoomDataSlot="profile-avatar-zoom"
        confirmDataSlot="profile-crop-save"
        cancelDataSlot="profile-crop-cancel"
        description={t("crop_avatar_description")}
        onOpenChange={(open) => {
          if (!open) closeCropDialog();
        }}
      />
    </div>
  );
}
