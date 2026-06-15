interface DocumentTab {
  name: string;
  id: string;
}

interface DocumentTabsParams {
  tabs: DocumentTab[];
  selectedTab: string;
  toggleTab: (tabId: string) => void;
}

export default function DocumentTabs({
  tabs,
  toggleTab,
  selectedTab,
}: DocumentTabsParams) {
  return (
    <div className="shrink-0 flex items-center gap-3 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-slot={`tab-${tab.id}`}
          onClick={() => toggleTab(tab.id)}
          className={`${selectedTab === tab.id ? "gradient-border" : ""} text-sm! h-8 px-3 w-max rounded-full! transition-all!`}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );
}
