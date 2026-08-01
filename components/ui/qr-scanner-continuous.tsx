"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Camera, RefreshCw, CheckCircle2, QrCode } from "lucide-react";
import { toast } from "sonner";

interface ContinuousQrScannerProps {
  title?: string;
  onScanSuccess: (decodedText: string) => Promise<void> | void;
}

export function ContinuousQrScanner({
  title = "Continuous Barcode & QR Scanner",
  onScanSuccess,
}: ContinuousQrScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [continuousMode, setContinuousMode] = useState(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  async function startScanner() {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      const html5QrCode = new Html5Qrcode("continuous-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          setLastScanned(decodedText);
          setScanCount((prev) => prev + 1);
          toast.success(`Scanned: ${decodedText}`);

          await onScanSuccess(decodedText);

          if (!continuousMode && scannerRef.current?.isScanning) {
            await scannerRef.current.stop();
            setScanning(false);
          }
        },
        () => {}
      );
      setScanning(true);
    } catch {
      toast.error("Failed to start camera. Check permissions.");
      setScanning(false);
    }
  }

  async function stopScanner() {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
    setScanning(false);
  }

  function toggleCamera() {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    if (scanning) {
      startScanner();
    }
  }

  return (
    <Card className="border-border/60 shadow-sm max-w-md mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-amber-500" />
            {title}
          </span>
          {scanCount > 0 && (
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {scanCount} scanned
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative overflow-hidden rounded-lg bg-black/90 aspect-square flex items-center justify-center border border-border/50">
          <div id="continuous-reader" className="w-full h-full" />
          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Camera className="h-10 w-10 stroke-1" />
              <span className="text-xs">Camera is inactive</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="continuous-mode"
              checked={continuousMode}
              onCheckedChange={setContinuousMode}
            />
            <Label htmlFor="continuous-mode" className="text-xs">
              Continuous Stream
            </Label>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={toggleCamera}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {facingMode === "environment" ? "Back Camera" : "Front Camera"}
          </Button>
        </div>

        <div className="flex gap-2">
          {!scanning ? (
            <Button className="w-full" size="sm" onClick={startScanner}>
              <Camera className="mr-2 h-4 w-4" /> Start Camera Scan
            </Button>
          ) : (
            <Button className="w-full" variant="destructive" size="sm" onClick={stopScanner}>
              Stop Scanner
            </Button>
          )}
        </div>

        {lastScanned && (
          <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate font-mono">Last: {lastScanned}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
