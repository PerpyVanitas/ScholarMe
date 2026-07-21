"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, ShieldAlert, User, History, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminScannerPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ id: string; name: string } | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanner = () => {
    setIsScanning(true);
    setScanResult(null);

    // Give the DOM a moment to render the reader div
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }, 100);
  };

  function onScanSuccess(decodedText: string) {
    // Expected format: scholarme_id:USER_ID:USER_NAME
    if (decodedText.startsWith("scholarme_id:")) {
      const parts = decodedText.split(":");
      if (parts.length >= 3) {
        const userId = parts[1];
        const userName = parts[2];

        setScanResult({ id: userId, name: userName });

        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
          setIsScanning(false);
        }

        toast.success(`Scanned: ${userName}`);
      }
    } else {
      toast.error("Invalid QR Code format");
    }
  }

  function onScanFailure(error: unknown) {
    // We can ignore failures as they happen frequently during scanning
  }

  const navigateToAudit = () => {
    if (scanResult) {
      router.push(`/dashboard/admin/users?userId=${scanResult.id}&userName=${encodeURIComponent(scanResult.name)}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Scanner</h1>
          <p className="text-sm text-muted-foreground">Scan ID cards to view user activity and logs.</p>
        </div>
      </div>

      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-border/60">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            QR Scanner
          </CardTitle>
          <CardDescription>
            Position the user's ID card QR code within the frame.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!isScanning && !scanResult && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="h-10 w-10 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Camera is currently inactive</p>
              <Button onClick={startScanner}>Activate Camera</Button>
            </div>
          )}

          {isScanning && (
            <div className="bg-black aspect-square max-w-[500px] mx-auto overflow-hidden relative">
              <div id="reader" className="w-full h-full"></div>
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                <div className="w-full h-full border-2 border-primary/50 rounded-lg"></div>
              </div>
            </div>
          )}

          {scanResult && (
            <div className="flex flex-col items-center justify-center py-12 gap-6 animate-in fade-in zoom-in duration-300">
              <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
                <User className="h-10 w-10 text-success" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold">{scanResult.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">{scanResult.id}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={startScanner}>
                  Scan Another
                </Button>
                <Button className="gap-2" onClick={navigateToAudit}>
                  <History className="h-4 w-4" />
                  View Audit Logs
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 items-start">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 dark:text-amber-200">
          <p className="font-semibold">Security Note</p>
          <p>This scanner is intended for authorized administrative use only. Scanning personal IDs for non-business purposes is strictly prohibited.</p>
        </div>
      </div>
    </div>
  );
}
