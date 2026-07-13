"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { Profile } from "@/lib/types";
import { QrIdCard } from "@/features/auth/components/qr-id-card";

interface BulkIdExporterProps {
  selectedUsers: Profile[];
  onClearSelection: () => void;
}

export function BulkIdExporter({ selectedUsers, onClearSelection }: BulkIdExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getUserRoleName(roles: any): string {
    if (Array.isArray(roles) && roles.length > 0) return roles[0].name;
    if (roles && typeof roles === "object" && !Array.isArray(roles))
      return roles.name;
    return "learner";
  }

  async function handleExport() {
    if (selectedUsers.length === 0) return;
    
    setIsExporting(true);
    toast.info(`Generating PDF for ${selectedUsers.length} ID(s)... Please do not navigate away.`);
    
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [54, 86] // Standard CR80 ID card size in mm
      });

      const cards = containerRef.current?.querySelectorAll('.id-card-wrapper');
      
      if (!cards || cards.length === 0) {
        throw new Error("Could not find card DOM elements");
      }

      for (let i = 0; i < cards.length; i++) {
        const cardElement = cards[i] as HTMLElement;
        
        // Use html2canvas to capture the card
        const canvas = await html2canvas(cardElement, {
          scale: 3, // Higher scale for better print quality
          useCORS: true,
          logging: false,
          backgroundColor: "#000000" // Match card background
        });

        const imgData = canvas.toDataURL('image/png');
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, 54, 86);
      }

      pdf.save(`Bulk_IDs_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Successfully exported IDs!");
      onClearSelection();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during export.");
    } finally {
      setIsExporting(false);
    }
  }

  if (selectedUsers.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 p-2 rounded-md">
        <span className="text-sm font-medium text-primary px-2">
          {selectedUsers.length} selected
        </span>
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export IDs (PDF)
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearSelection}
          disabled={isExporting}
        >
          Clear
        </Button>
      </div>

      {/* Hidden container to render cards for html2canvas */}
      <div 
        ref={containerRef}
        className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden" 
        style={{ width: '0px', height: '0px' }}
      >
        {selectedUsers.map((user) => (
          <div key={user.id} className="id-card-wrapper inline-block p-4 bg-black">
            <QrIdCard
              profile={user}
              role={getUserRoleName(user.roles)}
              showCompactPreview={false}
            />
          </div>
        ))}
      </div>
    </>
  );
}
