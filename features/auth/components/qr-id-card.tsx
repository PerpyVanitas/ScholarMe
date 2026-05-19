"use client";

import { QRCodeCanvas } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

interface QrIdCardProps {
  userId: string;
  userName: string;
  role: string;
}

export function QrIdCard({ userId, userName, role }: QrIdCardProps) {
  return (
    <Card className="w-full max-w-sm mx-auto overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 shadow-xl">
      <CardHeader className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            ScholarMe ID
          </CardTitle>
          <span className="text-[10px] uppercase tracking-widest opacity-70">Official Member</span>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex flex-col items-center gap-6">
        <div className="p-4 bg-white rounded-xl shadow-inner">
          <QRCodeCanvas 
            value={userId} 
            size={180}
            level="H"
            includeMargin={false}
            imageSettings={{
                src: "/logo.png", // Fallback if available
                x: undefined,
                y: undefined,
                height: 24,
                width: 24,
                excavate: true,
            }}
          />
        </div>
        
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold uppercase tracking-tight">{userName}</h3>
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
            {role}
          </div>
        </div>
        
        <div className="w-full border-t border-dashed border-slate-300 dark:border-slate-700 pt-4 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Unique Identification Number</p>
          <p className="font-mono text-sm font-medium">{userId.slice(0, 8)}...{userId.slice(-8)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
