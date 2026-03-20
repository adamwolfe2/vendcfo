"use client";

import { createClient } from "@vendcfo/supabase/client";
import { GraduationCap, Link, Play, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrainingVideo {
  id: string;
  team_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category: string;
  is_public: boolean;
  sort_order: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORIES = [
  "General",
  "Safety",
  "Equipment",
  "Route Management",
  "Customer Service",
  "Inventory",
] as const;

export function getEmbedUrl(url: string): string | null {
  if (!url) return null;

  try {
    // YouTube standard
    const ytMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/)([A-Za-z0-9_-]+)/,
    );
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

    // YouTube short
    const ytShort = url.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
    if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`;

    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/(?:video\/)?)(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    // Loom
    const loomMatch = url.match(/loom\.com\/share\/([A-Za-z0-9]+)/);
    if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;

    // Fallback: return as-is (user may paste direct embed URL)
    return url;
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#e0e0e0] bg-[#f5f5f5] px-2.5 py-0.5 text-xs font-medium text-[#555] capitalize">
      {category}
    </span>
  );
}

function VideoCard({
  video,
  showDelete,
  onDelete,
}: {
  video: TrainingVideo;
  showDelete?: boolean;
  onDelete?: (id: string) => void;
}) {
  const embedUrl = getEmbedUrl(video.video_url);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-[#e0e0e0] bg-white">
      {/* Video embed */}
      <div className="relative aspect-video w-full bg-[#f0f0f0]">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={video.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Play size={40} strokeWidth={1.5} className="text-[#999]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#111] leading-tight">
            {video.title}
          </h3>
          {showDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(video.id)}
              className="shrink-0 rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label="Delete video"
            >
              <Trash2 size={18} strokeWidth={1.5} />
            </button>
          )}
        </div>
        {video.description && (
          <p className="mb-3 line-clamp-2 text-xs text-[#666] leading-relaxed">
            {video.description}
          </p>
        )}
        <CategoryBadge category={video.category} />
      </div>
    </div>
  );
}

function EmptyState({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-20 px-6 text-center">
      <GraduationCap size={40} strokeWidth={1.5} className="mb-4 text-[#bbb]" />
      <p className="text-sm font-medium text-[#555]">{message}</p>
      {sub && <p className="mt-1 text-xs text-[#999]">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Video Modal
// ---------------------------------------------------------------------------

function AddVideoModal({
  onClose,
  onAdded,
  teamId,
}: {
  onClose: () => void;
  onAdded: () => void;
  teamId: string;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) return;

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase
      .from("training_videos")
      .insert({
        team_id: teamId,
        title: title.trim(),
        video_url: videoUrl.trim(),
        description: description.trim() || null,
        category: category.toLowerCase(),
        is_public: false,
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30">
      <div className="relative w-full max-h-[90vh] overflow-y-auto sm:max-w-lg rounded-t-xl sm:rounded-lg border border-[#e0e0e0] bg-white p-5 sm:p-6 shadow-lg sm:mx-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111]">Add Video</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:text-[#333]"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Route Safety Checklist"
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          {/* Video URL */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Video URL <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Link
                size={16}
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]"
              />
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                required
                placeholder="YouTube, Vimeo, or Loom link"
                className="w-full rounded-md border border-[#d0d0d0] bg-white py-2 pl-9 pr-3 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the video content"
              rows={3}
              className="w-full resize-none rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] outline-none transition-colors focus:border-[#888]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#d0d0d0] bg-white px-4 py-2 min-h-[44px] text-sm font-medium text-[#555] transition-colors hover:bg-[#f5f5f5] w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim() || !videoUrl.trim()}
              className="rounded-md bg-[#111] px-4 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-50 w-full sm:w-auto"
            >
              {saving ? "Saving..." : "Add Video"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Training Page (Client)
// ---------------------------------------------------------------------------

type Tab = "library" | "my-videos";

export function TrainingPage({
  publicVideos,
  teamId,
}: {
  publicVideos: TrainingVideo[];
  teamId: string;
}) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>("library");
  const [teamVideos, setTeamVideos] = useState<TrainingVideo[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchTeamVideos = useCallback(async () => {
    setLoadingTeam(true);
    const { data } = await supabase
      .from("training_videos")
      .select("*")
      .eq("team_id", teamId)
      .eq("is_public", false)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    setTeamVideos((data as TrainingVideo[]) ?? []);
    setLoadingTeam(false);
  }, [supabase, teamId]);

  useEffect(() => {
    if (activeTab === "my-videos") {
      fetchTeamVideos();
    }
  }, [activeTab, fetchTeamVideos]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("training_videos")
      .delete()
      .eq("id", id);

    if (!error) {
      setTeamVideos((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "library", label: "Library" },
    { key: "my-videos", label: "My Videos" },
  ];

  return (
    <div className="px-4 py-6 sm:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Training</h1>
        <p className="text-muted-foreground">
          Video resources and training materials for your team.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e0e0e0]">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-colors min-h-[44px] ${
                activeTab === tab.key
                  ? "border-b-2 border-[#111] text-[#111]"
                  : "text-[#888] hover:text-[#555]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "my-videos" && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="mb-2 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] w-full sm:w-auto"
          >
            <Plus size={16} strokeWidth={1.5} />
            Add Video
          </button>
        )}
      </div>

      {/* Tab content */}
      {activeTab === "library" && (
        <>
          {publicVideos.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {publicVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <EmptyState
              message="No public training videos yet"
              sub="The admin will add shared training content here."
            />
          )}
        </>
      )}

      {activeTab === "my-videos" && (
        <>
          {loadingTeam ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-video animate-pulse rounded-lg border border-[#e0e0e0] bg-[#f5f5f5]"
                />
              ))}
            </div>
          ) : teamVideos.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {teamVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  showDelete
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-20 px-6 text-center">
              <GraduationCap size={40} strokeWidth={1.5} className="mb-4 text-[#bbb]" />
              <p className="text-sm font-medium text-[#555]">No training videos yet</p>
              <p className="mt-1 text-xs text-[#999]">Upload videos to train your team on routes, safety, and equipment.</p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#333] min-h-[44px]"
              >
                <Plus size={16} strokeWidth={1.5} />
                Add your first video
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Video Modal */}
      {showAddModal && (
        <AddVideoModal
          teamId={teamId}
          onClose={() => setShowAddModal(false)}
          onAdded={fetchTeamVideos}
        />
      )}
    </div>
  );
}
