import { LibraryCatalog, PhysicalBook } from "@/components/library-catalog";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Physical Library | ScholarMe",
  description: "Browse the physical books available at the ScholarMe facility.",
};

export default async function LibraryPage() {
  const supabase = await createClient();
  
  // Attempt to fetch from DB. Fallback to mock data if empty or table doesn't exist yet
  const { data: books, error } = await supabase
    .from("physical_books")
    .select("*")
    .order("title");

  let initialBooks: PhysicalBook[] = books || [];

  if (initialBooks.length === 0) {
    initialBooks = [
      {
        id: "mock-1",
        title: "Calculus: Early Transcendentals",
        author: "James Stewart",
        isbn: "9781305480513",
        available_copies: 2,
        total_copies: 3,
        location_shelf: "Math A1",
        cover_image_url: "https://covers.openlibrary.org/b/isbn/9781305480513-M.jpg",
        description: "The definitive textbook for university calculus sequences."
      },
      {
        id: "mock-2",
        title: "Introduction to Algorithms",
        author: "Thomas H. Cormen",
        isbn: "9780262033848",
        available_copies: 0,
        total_copies: 1,
        location_shelf: "CS B4",
        cover_image_url: "https://covers.openlibrary.org/b/isbn/9780262033848-M.jpg",
        description: "A comprehensive update of the leading algorithms text."
      },
      {
        id: "mock-3",
        title: "Campbell Biology",
        author: "Lisa A. Urry",
        isbn: "9780134093413",
        available_copies: 5,
        total_copies: 5,
        location_shelf: "Science C2",
        cover_image_url: "https://covers.openlibrary.org/b/isbn/9780134093413-M.jpg",
        description: "The world's most successful majors biology text and media program."
      }
    ];
  }

  return (
    <div className="flex-1 space-y-4">
      <LibraryCatalog initialBooks={initialBooks} />
    </div>
  );
}
