import { LibraryCatalog } from "@/features/library/components/library-catalog";
import { toast } from "sonner";
import { getLibraryCatalog } from "@/features/library/api/actions";

export const metadata = {
  title: "Library Catalog | ScholarMe",
  description: "Browse physical books and equipment available at the facility.",
};

export default async function LibraryPage() {
  let initialResources: any[] = [];
  try {
    initialResources = await getLibraryCatalog();
  } catch (e) {
    console.error("Error fetching library catalog:", e);
    toast.error(e instanceof Error ? e.message : "An error occurred");
  }

  return (
    <div className="flex-1 space-y-4">
      <LibraryCatalog initialResources={initialResources} />
    </div>
  );
}
