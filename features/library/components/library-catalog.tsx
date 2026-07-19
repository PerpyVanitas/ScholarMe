"use client";

import { useState } from "react";
import { PhysicalResource } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Book, Calculator, Hash, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUser } from "@/lib/user-context";
import { addPhysicalResource, checkoutResource } from "../api/actions";
import { toast } from "sonner";
import { Html5QrcodeScanner } from "html5-qrcode";
import { CampusMapModal } from "./campus-map-modal";
import { CheckoutModal } from "./checkout-modal";

interface LibraryCatalogProps {
  initialResources: PhysicalResource[];
}

export function LibraryCatalog({ initialResources }: LibraryCatalogProps) {
  const [resources, setResources] = useState(initialResources);
  const [search, setSearch] = useState("");
  const { role } = useUser();
  const isAdmin =
    role === "administrator" ||
    role === "super_admin" ||
    [
      "president",
      "vice_president",
      "secretary",
      "treasurer",
      "auditor",
      "committee_head",
      "assistant_committee_head",
    ].includes(role as string);

  // Create Resource State
  const [openCreate, setOpenCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newIsbn, setNewIsbn] = useState("");
  const [newType, setNewType] = useState("book");
  const [newQty, setNewQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Scanner state
  const [scanning, setScanning] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);

  // Checkout Modal State
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedResource, setSelectedResource] =
    useState<PhysicalResource | null>(null);

  const filteredResources = resources.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.author && r.author.toLowerCase().includes(search.toLowerCase())) ||
      (r.isbn && r.isbn.includes(search)),
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    setSubmitting(true);
    try {
      await addPhysicalResource({
        title: newTitle,
        author: newAuthor,
        isbn: newIsbn,
        resource_type: newType,
        total_quantity: newQty,
      });
      toast.success("Resource added successfully.");
      setOpenCreate(false);
      // Ideally we would re-fetch or optimistically update, but revalidatePath will refresh the page.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: unknown) {
      // @ts-ignore: Strict unknown type check
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startScanner = () => {
    setScanning(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false,
      );
      scanner.render(
        (text) => {
          setNewIsbn(text);
          scanner.clear();
          setScanning(false);
          toast.success(`Scanned ISBN: ${text}`);
        },
        (err) => {
          // ignore scan errors
        },
      );
      setScannerReady(true);
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Library Catalog</h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-muted-foreground">
              Browse physical books and equipment.
            </p>
            <CampusMapModal />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search title, author, ISBN..."
              className="pl-8 w-[250px] lg:w-[300px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isAdmin && (
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Physical Resource</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <Input
                    placeholder="Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Author (optional)"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="ISBN (optional)"
                      value={newIsbn}
                      onChange={(e) => setNewIsbn(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={startScanner}
                    >
                      Scan
                    </Button>
                  </div>
                  {scanning && <div id="reader" className="w-full h-[300px]" />}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium">Type</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                      >
                        <option value="book">Book</option>
                        <option value="calculator">Calculator</option>
                        <option value="equipment">Equipment</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        value={newQty}
                        onChange={(e) => setNewQty(parseInt(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? "Saving..." : "Save Resource"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="flex flex-col overflow-hidden">
            <div className="aspect-[3/4] bg-muted/30 relative flex items-center justify-center p-4 border-b">
              {resource.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resource.cover_image_url}
                  alt={resource.title}
                  className="object-contain w-full h-full rounded shadow-sm"
                />
              ) : (
                <div className="text-muted-foreground opacity-50 flex flex-col items-center">
                  {resource.resource_type === "calculator" ? (
                    <Calculator className="w-16 h-16" />
                  ) : (
                    <Book className="w-16 h-16" />
                  )}
                </div>
              )}
              {resource.available_quantity > 0 ? (
                <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600">
                  Available ({resource.available_quantity})
                </Badge>
              ) : (
                <Badge variant="destructive" className="absolute top-2 right-2">
                  Checked Out
                </Badge>
              )}
            </div>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="line-clamp-2 text-lg leading-tight">
                {resource.title}
              </CardTitle>
              {resource.author && (
                <CardDescription className="line-clamp-1">
                  {resource.author}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1">
              {resource.isbn && (
                <div className="flex items-center text-xs text-muted-foreground gap-1">
                  <Hash className="w-3 h-3" /> {resource.isbn}
                </div>
              )}
            </CardContent>
            {isAdmin && (
              <CardFooter className="p-4 border-t bg-muted/10">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={resource.available_quantity === 0}
                  onClick={() => {
                    setSelectedResource(resource);
                    setCheckoutOpen(true);
                  }}
                >
                  Checkout to Learner
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}

        {filteredResources.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            No resources found.
          </div>
        )}
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        resource={selectedResource}
      />
    </div>
  );
}
