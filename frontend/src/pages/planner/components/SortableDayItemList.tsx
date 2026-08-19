import { useCallback } from "react";
import { Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type PlanItem } from "@/hooks/usePlanner";

const TIME_SLOT_ICONS: Record<string, string> = {
  "Morning (8AM - 12PM)": "ri-sun-line",
  "Afternoon (12PM - 5PM)": "ri-sun-line",
  "Evening (5PM - 9PM)": "ri-contrast-2-line",
  "Night (9PM+)": "ri-moon-line",
  "All Day": "ri-calendar-line",
  "Flexible": "ri-time-line",
};

function getTimeSlotIcon(slot: string): string {
  return TIME_SLOT_ICONS[slot] || "ri-time-line";
}

interface ItemDisplayInfo {
  name: string;
  url: string | null;
  subcategory: string;
}

interface SortableDayItemListProps {
  items: PlanItem[];
  planId: string;
  editingItemId: string | null;
  getItemDisplayInfo: (item: PlanItem) => ItemDisplayInfo;
  onToggleComplete: (itemId: string) => void;
  onUpdateNotes: (itemId: string, notes: string) => void;
  onRemove: (itemId: string) => void;
  onReorder: (reordered: PlanItem[]) => void;
  onSetEditingItemId: (itemId: string | null) => void;
}

interface SortableCardProps {
  item: PlanItem;
  info: ItemDisplayInfo;
  isEditing: boolean;
  onToggleComplete: (itemId: string) => void;
  onUpdateNotes: (itemId: string, notes: string) => void;
  onRemove: (itemId: string) => void;
  onSetEditingItemId: (itemId: string | null) => void;
  onBlurNotes: () => void;
}

function SortableCard({
  item,
  info,
  isEditing,
  onToggleComplete,
  onUpdateNotes,
  onRemove,
  onSetEditingItemId,
  onBlurNotes,
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.9 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-2xl border transition-all ${
        isDragging
          ? "border-primary-400 shadow-lg scale-[1.02]"
          : item.completed
            ? "border-accent-200/70 opacity-75"
            : "border-background-200/70"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="w-6 h-6 mt-0.5 flex items-center justify-center shrink-0 text-foreground-300 hover:text-foreground-500 cursor-grab active:cursor-grabbing transition-colors rounded"
            title="Drag to reorder"
          >
            <i className="ri-draggable text-base"></i>
          </button>

          {/* Complete checkbox */}
          <button
            onClick={() => onToggleComplete(item.id)}
            className={`w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              item.completed
                ? "bg-accent-500 border-accent-500 text-white"
                : "border-foreground-300 hover:border-accent-400 text-transparent hover:text-accent-300"
            }`}
          >
            <i className="ri-check-line text-sm"></i>
          </button>

          {/* Image */}
          {item.image && (
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-background-100">
              <img src={item.image} alt={info.name} className="w-full h-full object-cover object-top" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {/* Name */}
                {item.type === "custom" ? (
                  <h4
                    className={`font-heading text-sm font-semibold ${
                      item.completed
                        ? "text-foreground-400 line-through"
                        : "text-foreground-900"
                    }`}
                  >
                    {info.name}
                  </h4>
                ) : info.url ? (
                  <Link
                    to={info.url}
                    className={`font-heading text-sm font-semibold hover:text-primary-500 transition-colors cursor-pointer ${
                      item.completed
                        ? "text-foreground-400 line-through"
                        : "text-foreground-900"
                    }`}
                  >
                    {info.name}
                  </Link>
                ) : (
                  <h4 className="font-heading text-sm font-semibold text-foreground-900">{info.name}</h4>
                )}

                {/* Subcategory & time slot */}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-foreground-500">{info.subcategory}</span>
                  {item.timeSlot && item.timeSlot !== "Flexible" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-700 text-[11px] font-medium whitespace-nowrap">
                      <i className={`${getTimeSlotIcon(item.timeSlot)} text-[10px]`}></i>
                      {item.timeSlot}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onSetEditingItemId(isEditing ? null : item.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
                  title="Edit notes"
                >
                  <i className="ri-sticky-note-line text-sm"></i>
                </button>
                <button
                  onClick={() => onRemove(item.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-foreground-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Remove item"
                >
                  <i className="ri-delete-bin-6-line text-sm"></i>
                </button>
              </div>
            </div>

            {/* Notes */}
            {isEditing ? (
              <div className="mt-3">
                <textarea
                  value={item.notes}
                  onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                  onBlur={onBlurNotes}
                  placeholder="Add a note..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-background-200 bg-background-50 focus:outline-none focus:border-primary-300 text-foreground-700 placeholder:text-foreground-300 resize-y"
                  autoFocus
                ></textarea>
              </div>
            ) : item.notes ? (
              <p className="mt-2 text-xs text-foreground-500 italic leading-relaxed">{item.notes}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SortableDayItemList({
  items,
  planId: _planId,
  editingItemId,
  getItemDisplayInfo,
  onToggleComplete,
  onUpdateNotes,
  onRemove,
  onReorder,
  onSetEditingItemId,
}: SortableDayItemListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...items];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      // Update order values
      const updated = reordered.map((item, idx) => ({ ...item, order: idx }));
      onReorder(updated);
    },
    [items, onReorder],
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((item) => {
            const info = getItemDisplayInfo(item);
            const isEditing = editingItemId === item.id;
            return (
              <SortableCard
                key={item.id}
                item={item}
                info={info}
                isEditing={isEditing}
                onToggleComplete={onToggleComplete}
                onUpdateNotes={onUpdateNotes}
                onRemove={onRemove}
                onSetEditingItemId={onSetEditingItemId}
                onBlurNotes={() => onSetEditingItemId(null)}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}