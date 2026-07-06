"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Book } from "lucide-react";

export type PhysicalBook = {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  available_copies: number;
  total_copies: number;
  location_shelf: string | null;
  cover_image_url: string | null;
  description: string | null;
};

interface LibraryCatalogProps {
  initialBooks: PhysicalBook[];
}

export function LibraryCatalog({ initialBooks }: LibraryCatalogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBooks = initialBooks.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Facility Library</h2>
          <p className="text-muted-foreground">Browse and locate physical books available in the center.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search titles or authors..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
          <Book className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium">No books found</h3>
          <p className="text-muted-foreground text-sm mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="overflow-hidden flex flex-col">
              <div className="aspect-[2/3] w-full bg-muted relative border-b">
                {book.cover_image_url ? (
                  <img 
                    src={book.cover_image_url} 
                    alt={`Cover of ${book.title}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                    <Book className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <Badge variant={book.available_copies > 0 ? "default" : "destructive"}>
                    {book.available_copies > 0 ? `${book.available_copies} Available` : 'Checked Out'}
                  </Badge>
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="line-clamp-1" title={book.title}>{book.title}</CardTitle>
                <CardDescription className="line-clamp-1" title={book.author}>{book.author}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-1">
                {book.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{book.description}</p>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0 border-t bg-muted/20 flex justify-between items-center text-xs text-muted-foreground">
                <span>Shelf: <strong className="text-foreground">{book.location_shelf || 'Unassigned'}</strong></span>
                <span>{book.total_copies} Total</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
