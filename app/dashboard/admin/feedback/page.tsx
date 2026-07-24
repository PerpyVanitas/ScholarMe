"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

interface FeedbackItem {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  status: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

const COLUMNS = [
  { id: "pending", title: "Pending", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "in_progress", title: "In Progress", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "resolved", title: "Resolved", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

function DraggableCard({ item }: { item: FeedbackItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: item,
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : undefined,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-card border border-border/60 rounded-lg p-4 shadow-sm cursor-grab active:cursor-grabbing mb-3 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3 mb-3 pointer-events-none">
        <Avatar className="h-8 w-8">
          <AvatarImage src={item.profiles?.avatar_url || ""} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {item.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.profiles?.full_name || "Unknown User"}</p>
          <p className="text-[10px] text-muted-foreground truncate">{format(new Date(item.created_at), "MMM d, h:mm a")}</p>
        </div>
      </div>
      <div className="text-xs text-foreground/90 bg-muted/40 p-2 rounded line-clamp-3 pointer-events-none">
        {item.content}
      </div>
    </div>
  );
}

function KanbanColumn({ column, items }: { column: typeof COLUMNS[0], items: FeedbackItem[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className={`flex flex-col flex-1 bg-muted/20 border rounded-xl overflow-hidden min-w-[300px] transition-colors ${isOver ? 'border-primary/50 bg-primary/5' : 'border-border/40'}`}>
      <div className="p-4 border-b border-border/40 bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${column.bg}`}>
            <column.icon className={`h-4 w-4 ${column.color}`} />
          </div>
          <h3 className="font-semibold text-sm">{column.title}</h3>
        </div>
        <span className="text-xs font-medium bg-muted px-2 py-1 rounded-full">{items.length}</span>
      </div>
      <div ref={setNodeRef} className="p-3 flex-1 flex flex-col min-h-[500px]">
        {items.map(item => (
          <DraggableCard key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <div className="flex-1 border-2 border-dashed border-border/40 rounded-lg flex items-center justify-center m-2 pointer-events-none">
            <span className="text-xs text-muted-foreground">Drop items here</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<FeedbackItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    const controller = new AbortController();
    async function loadFeedback() {
      try {
        const response = await fetch("/api/v1/admin/feedback", { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Failed to fetch feedback");
        }
        const data = await response.json();
        // Set default status to pending if none
        const f = (data.data || []).map((item: FeedbackItem) => ({
          ...item,
          status: item.status || "pending"
        }));
        setFeedback(f);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error(error);
        toast.error("Failed to load feedback");
      } finally {
        setLoading(false);
      }
    }
    loadFeedback();
    return () => controller.abort();
  }, []);

  async function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const targetStatus = COLUMNS.find(c => c.id === overId)?.id;
    if (!targetStatus) return;

    const itemToUpdate = feedback.find(f => f.id === activeId);
    if (!itemToUpdate || itemToUpdate.status === targetStatus) return;

    // Optimistic update
    setFeedback(prev => prev.map(f => f.id === activeId ? { ...f, status: targetStatus } : f));

    try {
      const res = await fetch("/api/v1/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback_id: activeId, status: targetStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success("Feedback status updated");
    } catch {
      toast.error("Failed to update status");
      // Revert on failure
      setFeedback(prev => prev.map(f => f.id === activeId ? { ...f, status: itemToUpdate.status } : f));
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const activeId = event.active.id as string;
    const item = feedback.find(f => f.id === activeId);
    if (item) setActiveItem(item);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Feedback Triage
        </h1>
        <p className="text-muted-foreground">
          Drag and drop feedback to update its status.
        </p>
      </div>

      <DndContext 
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col lg:flex-row gap-6 items-stretch overflow-x-auto pb-4">
          {COLUMNS.map(column => (
            <KanbanColumn 
              key={column.id} 
              column={column} 
              items={feedback.filter(f => f.status === column.id)} 
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="bg-card border border-primary/50 shadow-xl rounded-lg p-4 w-[300px] opacity-90 scale-105 transform cursor-grabbing">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activeItem.profiles?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {activeItem.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activeItem.profiles?.full_name || "Unknown User"}</p>
                </div>
              </div>
              <div className="text-xs text-foreground/90 bg-muted/40 p-2 rounded line-clamp-3">
                {activeItem.content}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
