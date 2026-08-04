"use client";

export interface TagInputProps<T> {
  tags: T[];
  onRemove: (index: number) => void;
  onAddClick: () => void;
  renderLabel: (tag: T) => string;
  placeholder?: string;
}

export default function TagInput<T>({
  tags,
  onRemove,
  onAddClick,
  renderLabel,
  placeholder = "Tambahkan Tag",
}: TagInputProps<T>) {
  return (
    <div className="border border-black/20 rounded-lg p-3 flex flex-wrap gap-2 items-center min-h-[60px]">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="flex items-center gap-2 border border-black/30 rounded-full pl-4 pr-2 py-2 text-sm"
        >
          {renderLabel(tag)}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10"
            aria-label="Hapus"
          >
            ×
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onAddClick}
        className="text-black/50 text-sm px-2 py-2 hover:text-black"
      >
        {placeholder}
      </button>
    </div>
  );
}