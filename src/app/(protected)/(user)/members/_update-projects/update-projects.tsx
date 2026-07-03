"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { SpinnerButton } from "@/components/ui/spinner-button";
import { Member } from "@/lib/models/member";
import { Project } from "@/lib/models/project";
import { ModalInjectedProps } from "@/lib/providers/modal-provider";
import { MemberService } from "@/lib/services/member.service";
import { ProjectService } from "@/lib/services/project.service";
import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function UpdateProjects({
  member,
  closeModal,
  dismissModal,
}: { member: Member } & ModalInjectedProps<boolean>) {
  const sharedT = useTranslations("shared");
  const t = useTranslations("update_projects");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const memberService = useMemo(() => new MemberService(), []);
  const projectService = useMemo(() => new ProjectService(), []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [activeProjects, memberProjectIds] = await Promise.all([
          projectService.getAllActiveProjects(),
          // memberService.getMemberProjectIds(member.id),
          [],
        ]);

        setProjects(activeProjects);
        setSelectedProjectIds(memberProjectIds);
      } catch (error) {
        console.error(error);
        toast.error(t("could_not_load"));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [member.id, memberService, projectService, t]);

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId],
    );
  };

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      await memberService.updateMemberProjects(member.id, selectedProjectIds);
      toast.success(t("projects_updated"));
      dismissModal(true);
    } catch (error) {
      console.error(error);
      toast.error(t("could_not_update"));
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
    <section data-slot="update-projects-modal">
      <p className="text-xl font-medium mb-1">{t("manage_projects")}</p>
      <p className="text-sm text-muted-foreground mb-6">{member.name}</p>

      {!projects.length ? (
        <p className="text-sm text-muted-foreground">
          {t("projects_not_found")}
        </p>
      ) : (
        <ul className="max-h-80 overflow-auto space-y-2 pr-1">
          {projects.map((project) => {
            const isSelected = selectedProjectIds.includes(project.id);

            return (
              <li key={project.id}>
                <button
                  type="button"
                  data-selected={isSelected}
                  onClick={() => toggleProject(project.id)}
                  data-slot={`update-projects-card-${project.id}`}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-lg px-4 py-3 text-start transition-colors cursor-pointer border border-primary/50",
                    "hover:bg-primary/20",
                    isSelected && "bg-primary/10 hover:bg-primary/15",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors border-primary bg-primary/50",
                      isSelected ? "text-primary-foreground" : "bg-transparent",
                    )}
                  >
                    {isSelected ? <Check className="size-3" /> : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{project.name}</p>

                    {project.client?.name ? (
                      <p className="text-sm text-muted-foreground truncate">
                        {project.client.name}
                      </p>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex justify-end items-center gap-6 mt-8">
        <Field className="w-fit">
          <Button
            size="lg"
            type="button"
            disabled={submitting}
            onClick={() => closeModal()}
            data-slot="update-projects-cancel"
            className="max-w-28 rounded bg-transparent text-black dark:text-white cursor-pointer hover:text-white dark:hover:text-black hover:bg-black dark:hover:bg-white"
          >
            {sharedT("cancel")}
          </Button>
        </Field>

        <Field className="w-fit">
          <SpinnerButton
            size="lg"
            type="button"
            onClick={onSubmit}
            loading={submitting}
            dataSlot="update-projects-save"
            className="max-w-28 rounded bg-transparent border border-primary/40 cursor-pointer not-hover:text-primary"
          >
            {sharedT("save")}
          </SpinnerButton>
        </Field>
      </div>
    </section>
  );
}
