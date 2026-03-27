"use client";

import { decryptPassword, encryptPassword } from "@/utils/vault-crypto";
import { createClient } from "@vendcfo/supabase/client";
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PasswordEntry {
  id: string;
  team_id: string;
  created_by: string;
  title: string;
  username: string | null;
  encrypted_password: string;
  website_url: string | null;
  category: string;
  notes: string | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  "General",
  "WiFi",
  "Supplier Portal",
  "Banking",
  "Software",
  "Social Media",
  "Email",
  "Other",
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-[#f0f0f0] text-[#555] border-[#ddd]",
  wifi: "bg-[#eef6ff] text-[#2563eb] border-[#bfdbfe]",
  "supplier portal": "bg-[#fef3e2] text-[#b45309] border-[#fde68a]",
  banking: "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]",
  software: "bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe]",
  "social media": "bg-[#fdf2f8] text-[#db2777] border-[#fbcfe8]",
  email: "bg-[#fff7ed] text-[#ea580c] border-[#fed7aa]",
  other: "bg-[#f0f0f0] text-[#555] border-[#ddd]",
};

// ---------------------------------------------------------------------------
// Password Generator
// ---------------------------------------------------------------------------

function generatePassword(length = 16): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?";
  const allChars = uppercase + lowercase + numbers + symbols;

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  // Ensure at least one of each type
  const result: string[] = [];
  result.push(uppercase[array[0]! % uppercase.length]!);
  result.push(lowercase[array[1]! % lowercase.length]!);
  result.push(numbers[array[2]! % numbers.length]!);
  result.push(symbols[array[3]! % symbols.length]!);

  for (let i = 4; i < length; i++) {
    result.push(allChars[array[i]! % allChars.length]!);
  }

  // Shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = array[i]! % (i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }

  return result.join("");
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CategoryBadge({ category }: { category: string }) {
  const colorClass =
    CATEGORY_COLORS[category.toLowerCase()] ?? CATEGORY_COLORS.general;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${colorClass}`}
    >
      {category}
    </span>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-20 px-6 text-center">
      <KeyRound size={40} strokeWidth={1.5} className="mb-4 text-[#bbb]" />
      <p className="text-sm font-medium text-[#555]">No passwords stored yet</p>
      <p className="mt-1 text-xs text-[#999]">
        Store WiFi codes, supplier portal logins, and other credentials securely.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#333] min-h-[44px]"
      >
        <Plus size={16} strokeWidth={1.5} />
        Add your first entry
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Password Entry Row
// ---------------------------------------------------------------------------

function PasswordRow({
  entry,
  teamId,
  onEdit,
  onDelete,
}: {
  entry: PasswordEntry;
  teamId: string;
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPw, setDecryptedPw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [decrypting, setDecrypting] = useState(false);

  const handleShowToggle = async () => {
    if (showPassword) {
      setShowPassword(false);
      setDecryptedPw(null);
      return;
    }
    setDecrypting(true);
    try {
      const pw = await decryptPassword(entry.encrypted_password, teamId);
      setDecryptedPw(pw);
      setShowPassword(true);
    } catch {
      setDecryptedPw("[decryption failed]");
      setShowPassword(true);
    }
    setDecrypting(false);
  };

  const handleCopy = async () => {
    try {
      const pw = await decryptPassword(entry.encrypted_password, teamId);
      await navigator.clipboard.writeText(pw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-lg border border-[#e0e0e0] bg-white px-3 sm:px-4 py-3 transition-colors hover:border-[#ccc] hover:bg-[#fafafa]">
      {/* Top row on mobile: Lock icon + Title + Username */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5] text-[#666]">
          <Lock size={18} strokeWidth={1.5} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-[#111]">
              {entry.title}
            </span>
            {entry.is_shared && (
              <span className="shrink-0 rounded border border-[#d0d0d0] bg-[#f5f5f5] px-1.5 py-0.5 text-[10px] font-medium text-[#888] uppercase tracking-wide">
                Shared
              </span>
            )}
          </div>
          {entry.username && (
            <p className="truncate text-xs text-[#888]">{entry.username}</p>
          )}
        </div>
      </div>

      {/* Password display */}
      <div className="hidden w-40 sm:block">
        {showPassword ? (
          <span className="font-mono text-xs text-[#333] break-all">
            {decryptedPw}
          </span>
        ) : (
          <span className="text-sm text-[#ccc] tracking-widest">
            ************
          </span>
        )}
      </div>

      {/* Website */}
      <div className="hidden w-36 md:block">
        {entry.website_url ? (
          <a
            href={
              entry.website_url.startsWith("http")
                ? entry.website_url
                : `https://${entry.website_url}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 truncate text-xs text-[#2563eb] hover:underline"
          >
            <span className="truncate">
              {entry.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </span>
            <ExternalLink size={12} strokeWidth={1.5} className="shrink-0" />
          </a>
        ) : (
          <span className="text-xs text-[#ccc]">--</span>
        )}
      </div>

      {/* Category */}
      <div className="hidden lg:block">
        <CategoryBadge category={entry.category} />
      </div>

      {/* Actions — bottom row on mobile */}
      <div className="flex shrink-0 items-center gap-1 border-t border-[#f0f0f0] pt-2 sm:border-0 sm:pt-0">
        <button
          type="button"
          onClick={handleCopy}
          title="Copy password"
          className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#555]"
        >
          {copied ? (
            <span className="text-[10px] font-medium text-green-600">
              Copied!
            </span>
          ) : (
            <Copy size={18} strokeWidth={1.5} />
          )}
        </button>
        <button
          type="button"
          onClick={handleShowToggle}
          disabled={decrypting}
          title={showPassword ? "Hide password" : "Show password"}
          className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#555] disabled:opacity-50"
        >
          {showPassword ? (
            <EyeOff size={18} strokeWidth={1.5} />
          ) : (
            <Eye size={18} strokeWidth={1.5} />
          )}
        </button>
        <button
          type="button"
          onClick={() => onEdit(entry)}
          title="Edit"
          className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#555]"
        >
          <Pencil size={18} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          title="Delete"
          className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#999] transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={18} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit Modal
// ---------------------------------------------------------------------------

function PasswordModal({
  mode,
  entry,
  teamId,
  userId,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  entry?: PasswordEntry | null;
  teamId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase: any = createClient();
  const [title, setTitle] = useState(entry?.title ?? "");
  const [username, setUsername] = useState(entry?.username ?? "");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState(entry?.website_url ?? "");
  const [category, setCategory] = useState(entry?.category ?? "general");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [isShared, setIsShared] = useState(entry?.is_shared ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Decrypt existing password for editing
  useEffect(() => {
    if (mode === "edit" && entry) {
      setLoadingExisting(true);
      decryptPassword(entry.encrypted_password, teamId)
        .then((pw) => setPassword(pw))
        .catch(() => setPassword(""))
        .finally(() => setLoadingExisting(false));
    }
  }, [mode, entry, teamId]);

  const handleGenerate = () => {
    const pw = generatePassword(16);
    setPassword(pw);
    setShowPw(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !password.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const encPw = await encryptPassword(password, teamId);

      if (mode === "add") {
        const { error: insertError } = await supabase
          .from("password_vault")
          .insert({
            team_id: teamId,
            created_by: userId,
            title: title.trim(),
            username: username.trim() || null,
            encrypted_password: encPw,
            website_url: websiteUrl.trim() || null,
            category: category.toLowerCase(),
            notes: notes.trim() || null,
            is_shared: isShared,
          });

        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }
      } else if (entry) {
        const { error: updateError } = await supabase
          .from("password_vault")
          .update({
            title: title.trim(),
            username: username.trim() || null,
            encrypted_password: encPw,
            website_url: websiteUrl.trim() || null,
            category: category.toLowerCase(),
            notes: notes.trim() || null,
            is_shared: isShared,
            updated_at: new Date().toISOString(),
          })
          .eq("id", entry.id);

        if (updateError) {
          setError(updateError.message);
          setSaving(false);
          return;
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      setError("Encryption failed. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30">
      <div className="relative w-full max-h-[90vh] overflow-y-auto sm:mx-4 sm:max-w-lg rounded-t-xl sm:rounded-lg border border-[#e0e0e0] bg-white p-5 sm:p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111]">
            {mode === "add" ? "Add Entry" : "Edit Entry"}
          </h2>
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
              placeholder="e.g. Company WiFi, Supplier Portal"
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          {/* Username / Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Username / Email
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username or email"
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loadingExisting}
                  placeholder={
                    loadingExisting ? "Decrypting..." : "Enter password"
                  }
                  className="w-full rounded-md border border-[#d0d0d0] bg-white py-2 pl-3 pr-9 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888] disabled:opacity-50 min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#aaa] hover:text-[#555]"
                >
                  {showPw ? (
                    <EyeOff size={16} strokeWidth={1.5} />
                  ) : (
                    <Eye size={16} strokeWidth={1.5} />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#d0d0d0] bg-white px-3 py-2 min-h-[44px] text-sm font-medium text-[#555] transition-colors hover:bg-[#f5f5f5] w-full sm:w-auto"
              >
                <RefreshCw size={14} strokeWidth={1.5} />
                Generate
              </button>
            </div>
          </div>

          {/* Website URL */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Website URL
            </label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
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
                <option key={cat} value={cat.toLowerCase()}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this credential"
              rows={3}
              className="w-full resize-none rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
            />
          </div>

          {/* Share with team toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsShared(!isShared)}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                isShared ? "bg-[#111]" : "bg-[#d0d0d0]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                  isShared ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm text-[#555]">Share with team</span>
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
              disabled={saving || !title.trim() || !password.trim()}
              className="rounded-md bg-[#111] px-4 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-50 w-full sm:w-auto"
            >
              {saving
                ? "Saving..."
                : mode === "add"
                  ? "Add Entry"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------

function DeleteConfirmModal({
  onConfirm,
  onCancel,
  deleting,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative mx-4 w-full max-w-sm rounded-lg border border-[#e0e0e0] bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-[#111]">Delete Entry</h3>
        <p className="mt-2 text-sm text-[#666]">
          Are you sure you want to delete this password entry? This action
          cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[#d0d0d0] bg-white px-4 py-2 text-sm font-medium text-[#555] transition-colors hover:bg-[#f5f5f5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Password Vault Component
// ---------------------------------------------------------------------------

export function PasswordVault({
  teamId,
  userId,
}: {
  teamId: string;
  userId: string;
}) {
  const supabase: any = createClient();
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<PasswordEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);

    // Fetch shared entries for the team + user's own entries
    const { data: sharedData } = await supabase
      .from("password_vault")
      .select("*")
      .eq("team_id", teamId)
      .eq("is_shared", true)
      .order("title", { ascending: true });

    const { data: ownData } = await supabase
      .from("password_vault")
      .select("*")
      .eq("team_id", teamId)
      .eq("created_by", userId)
      .eq("is_shared", false)
      .order("title", { ascending: true });

    // Combine and deduplicate
    const all = [...(sharedData ?? []), ...(ownData ?? [])] as PasswordEntry[];
    const seen = new Set<string>();
    const unique = all.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    // Sort alphabetically by title
    unique.sort((a, b) => a.title.localeCompare(b.title));

    setEntries(unique);
    setLoading(false);
  }, [supabase, teamId, userId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    const { error } = await supabase
      .from("password_vault")
      .delete()
      .eq("id", deleteId);

    if (!error) {
      setEntries((prev) => prev.filter((e) => e.id !== deleteId));
    }
    setDeleteId(null);
    setDeleting(false);
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.username && e.username.toLowerCase().includes(q)) ||
        (e.website_url && e.website_url.toLowerCase().includes(q)),
    );
  }, [entries, searchQuery]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:p-8">
      {/* Header */}
      <div className="mb-2 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Password Vault
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Securely store and manage credentials for your team.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#111] px-3.5 py-2 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-[#333] w-full sm:w-auto"
        >
          <Plus size={16} strokeWidth={1.5} />
          Add Entry
        </button>
      </div>

      {/* Security note */}
      <div className="mb-6 flex items-center gap-2 rounded-md border border-[#e0e0e0] bg-[#fafafa] px-3 py-2">
        <Shield size={14} strokeWidth={1.5} className="shrink-0 text-[#888]" />
        <span className="text-xs text-[#888]">
          Passwords are encrypted before storage. Only your team can decrypt
          them.
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search
          size={16}
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title, username, or website..."
          className="w-full rounded-md border border-[#d0d0d0] bg-white py-2 pl-9 pr-3 text-sm text-[#111] placeholder-[#aaa] outline-none transition-colors focus:border-[#888]"
        />
      </div>

      {/* Entries list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-[#e0e0e0] bg-[#f5f5f5]"
            />
          ))}
        </div>
      ) : filteredEntries.length > 0 ? (
        <div className="space-y-2">
          {filteredEntries.map((entry) => (
            <PasswordRow
              key={entry.id}
              entry={entry}
              teamId={teamId}
              onEdit={(e) => setEditEntry(e)}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      ) : entries.length > 0 && searchQuery.trim() ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0d0d0] bg-[#fafafa] py-16 px-6 text-center">
          <Search size={32} strokeWidth={1.5} className="mb-3 text-[#bbb]" />
          <p className="text-sm font-medium text-[#555]">No results found</p>
          <p className="mt-1 text-xs text-[#999]">
            Try a different search term.
          </p>
        </div>
      ) : (
        <EmptyState onAdd={() => setShowAddModal(true)} />
      )}

      {/* Count */}
      {!loading && entries.length > 0 && (
        <p className="mt-4 text-xs text-[#999]">
          {filteredEntries.length} of {entries.length} entries
        </p>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <PasswordModal
          mode="add"
          teamId={teamId}
          userId={userId}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchEntries}
        />
      )}

      {/* Edit Modal */}
      {editEntry && (
        <PasswordModal
          mode="edit"
          entry={editEntry}
          teamId={teamId}
          userId={userId}
          onClose={() => setEditEntry(null)}
          onSaved={fetchEntries}
        />
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <DeleteConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
