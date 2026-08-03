import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AyahReader } from "@/components/quran/ayah-reader";
import { BookmarksTab } from "@/components/quran/bookmarks-tab";
import { SurahList } from "@/components/quran/surah-list";
import { HifdhTab } from "@/components/quran/hifdh-tab";
import { PageHeader } from "@/components/layout/page-header";
import { getSurahs } from "@/lib/api/endpoints";
import type { SurahResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/quran")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Qur'an — Muslim Life OS" },
      {
        name: "description",
        content: "Read the Qur'an surah by surah, bookmark ayahs and keep your place.",
      },
      { property: "og:title", content: "Qur'an — Muslim Life OS" },
      {
        property: "og:description",
        content: "Read the Qur'an surah by surah, bookmark ayahs and keep your place.",
      },
    ],
  }),
  component: QuranPage,
});

type Tab = "surahs" | "bookmarks" | "hifdh";

function QuranPage() {
  const [activeTab, setActiveTab] = useState<Tab>("surahs");
  const [openSurah, setOpenSurah] = useState<SurahResponse | null>(null);

  // Pre-fetch surahs so the bookmarks tab can resolve names
  const surahsQuery = useQuery({
    queryKey: ["surahs"],
    queryFn: getSurahs,
    staleTime: 24 * 60 * 60 * 1000,
  });

  // ── Ayah reader view ─────────────────────────────────────────────────────
  if (openSurah) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)]">
        <AyahReader surah={openSurah} onBack={() => setOpenSurah(null)} />
      </div>
    );
  }

  // ── Main Qur'an screen ────────────────────────────────────────────────────
  return (
    <>
      <PageHeader title="Qur'an" arabic="القُرْآن" subtitle="Read at your own pace" />

      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Qur'an sections"
        className="mb-6 flex gap-2 overflow-x-auto pb-2"
      >
        {(["surahs", "bookmarks", "hifdh"] as const).map((tab) => (
          <button
            key={tab}
            id={`quran-tab-${tab}`}
            role="tab"
            aria-selected={activeTab === tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
              activeTab === tab
                ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                : "text-[var(--mute)] hover:bg-[var(--line)]"
            )}
          >
            {tab === "surahs" ? "All Surahs" : tab === "bookmarks" ? "Bookmarks" : "Hifdh"}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="flex flex-col gap-4">
        {activeTab === "surahs" ? (
          <SurahList onSelect={setOpenSurah} />
        ) : activeTab === "bookmarks" ? (
          <BookmarksTab
            surahs={surahsQuery.data ?? []}
            onNavigateToSurah={(s) => {
              setOpenSurah(s);
            }}
          />
        ) : (
          <HifdhTab
            surahs={surahsQuery.data ?? []}
            onNavigateToSurah={(s) => {
              setOpenSurah(s);
            }}
          />
        )}
      </div>
    </>
  );
}
