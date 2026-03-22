"use client";

import type { Editor as EditorInstance, JSONContent } from "@tiptap/react";
import { cn } from "@vendcfo/ui/cn";
import { Editor as BaseEditor } from "@vendcfo/ui/editor";
import { useCallback, useState } from "react";

type Props = {
  initialContent?: JSONContent;
  className?: string;
  onChange?: (content?: JSONContent | null) => void;
  onBlur?: (content: JSONContent | null) => void;
  placeholder?: string;
  disablePlaceholder?: boolean;
  tabIndex?: number;
};

export function Editor({
  initialContent,
  className,
  onChange,
  onBlur,
  placeholder,
  disablePlaceholder = false,
  tabIndex,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [content, setContent] = useState<JSONContent | null | undefined>(
    initialContent,
  );

  const handleUpdate = useCallback(
    (editor: EditorInstance) => {
      const json = editor.getJSON();
      const newIsEmpty = editor.state.doc.textContent.length === 0;

      setContent(newIsEmpty ? null : json);
      onChange?.(newIsEmpty ? null : json);
    },
    [onChange],
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);

    // Only call onBlur if the content has changed
    if (content !== initialContent) {
      onBlur?.(content ?? null);
    }
    onBlur?.(content ?? null);
  }, [content, onBlur]);

  const showPlaceholder = !disablePlaceholder && !content && !isFocused;

  return (
    <BaseEditor
      className={cn(
        "text-[11px] text-primary leading-[18px] invoice-editor",
        showPlaceholder &&
          "w-full bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)]",
        className,
      )}
      placeholder={placeholder}
      initialContent={content ?? undefined}
      onUpdate={handleUpdate}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      tabIndex={tabIndex}
    />
  );
}
