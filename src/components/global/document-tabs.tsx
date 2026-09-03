import { cn } from "@/lib/utils/cn";

interface DocumentTab {
  name: string;
  id: string;
}

interface DocumentTabsParams {
  tabs: DocumentTab[];
  selectedTab: string;
  toggleTab: (tabId: string) => void;
  className?: string;
  tabClassName?: string;
}

export default function DocumentTabs({
  tabs,
  toggleTab,
  selectedTab,
  className,
  tabClassName,
}: DocumentTabsParams) {
  return (
    <div
      className={cn("shrink-0 flex items-center gap-3 flex-wrap", className)}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-slot={`tab-${tab.id}`}
          onClick={() => toggleTab(tab.id)}
          className={cn(
            "text-sm! h-8 px-3 w-max rounded-full! transition-all! hover:brightness-75",
            selectedTab === tab.id ? "gradient-border" : "",
            tabClassName,
          )}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );
}
