"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ErrorAlert } from "@/components/ui/error-alert";

interface CardScannerProps {
  onScanSuccess: (cardId: string, pin?: string, sig?: string) => void;
  isProcessing: boolean;
  error?: string;
}

export function CardScanner({
  onScanSuccess,
  isProcessing,
  error,
}: CardScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    // Cleanup function when component unmounts
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []);

  const startScanner = () => {
    setScannerActive(true);
    setPermissionError(false);

    // Small timeout to allow DOM to render the scanner div
    setTimeout(() => {
      if (scannerRef.current) return; // Already running

      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        },
        false, // verbose
      );

      scannerRef.current.render(
        (decodedText) => {
          try {
            // Stop scanning once we get a result
            if (scannerRef.current) {
              scannerRef.current.clear().catch(console.error);
              scannerRef.current = null;
            }
            setScannerActive(false);

            // Expecting JSON: { "cardId": "...", "sig": "..." } or legacy { "cardId": "...", "pin": "..." }
            const data = JSON.parse(decodedText);
            if (data.cardId && (data.sig || data.pin)) {
              onScanSuccess(data.cardId, data.pin, data.sig);
            } else {
              throw new Error("Invalid QR code format");
            }
          } catch (e) {
            console.error("QR Parse Error", e);
            toast.error(
              "Invalid QR Code format. Please scan a valid ScholarMe ID card.",
            );
          }
        },
        () => {
          // parse errors are normal (no qr code found in frame), ignore them
        },
      );
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setScannerActive(false);
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4 border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <ErrorAlert error={error} />}

      {!scannerActive ? (
        <div className="flex flex-col items-center justify-center p-8 gap-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900 border-dashed">
          <div className="p-4 bg-primary/10 rounded-full">
            <Camera className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold">Scan your ID Card</h3>
            <p className="text-xs text-muted-foreground mt-1 text-balance">
              Hold your digital or printed QR code in front of the camera.
            </p>
          </div>
          <Button onClick={startScanner} className="w-full mt-2">
            Open Camera
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-lg border bg-black">
            <div id="qr-reader" className="w-full"></div>
          </div>
          <Button variant="outline" onClick={stopScanner}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
