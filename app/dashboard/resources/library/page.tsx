import { LibraryCatalog } from "@/features/library/components/library-catalog";
import { getLibraryCatalog } from "@/features/library/api/actions";

export const metadata = {
  title: "Library Catalog | ScholarMe",
  description: "Browse physical books and equipment available at the facility.",
};

export default async function LibraryPage() {
  let initialResources = [];
  try {
    initialResources = await getLibraryCatalog();
  } catch (e) {
    console.error("Error fetching library catalog:", e);
  }

  // Fallback mock data to display structure before DB tables are present
  if (initialResources.length === 0) {
    initialResources = [
      {
        id: "mock-lib-1",
        title: "Calculus: Early Transcendentals",
        author: "James Stewart",
        isbn: "9781285741550",
        resource_type: "book",
        cover_image_url:
          "https://covers.openlibrary.org/b/isbn/9781285741550-M.jpg",
        total_quantity: 3,
        available_quantity: 2,
        location: "A1-Shelf",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "mock-lib-2",
        title: "Texas Instruments TI-84 Plus CE",
        author: null,
        isbn: null,
        resource_type: "calculator",
        cover_image_url: null,
        total_quantity: 5,
        available_quantity: 0,
        location: "Front Desk",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ] as any;
  }

  return (
    <div className="flex-1 space-y-4">
      <LibraryCatalog initialResources={initialResources} />
    </div>
  );
}
