"use client";

import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Profile, HsDesignation } from "@/lib/types";
import { HonorSocietyLogo } from "@/components/honsoc-logo";
import { RotateCw, ShieldAlert, Award, User, Book, CreditCard, Calendar, Download, Loader2, X as XIcon } from "lucide-react";

export interface QrIdCardProps {
  profile: Profile;
  role: string;
  showCompactPreview?: boolean;
  designation?: HsDesignation | null;
  cardPin?: string;
}

function getPresidentName(academicYear: string | null | undefined): string {
  if (academicYear === "2022-2023") return "Viviene Angeli Montanes";
  if (academicYear === "2023-2024") return "Jeshiah Vivienne Narca";
  if (academicYear === "2024-2025") return "Van Woodroe Perpetua";
  if (academicYear === "2025-2026") return "Aljane Faith Crisostomo";
  return "Honor Society President";
}

/** Format a designation for display on the ID card badge */
function getDesignationLabel(designation: HsDesignation | null | undefined): string {
  if (!designation) return "MEMBER";
  switch (designation.designation) {
    case "officer":
      return designation.position?.toUpperCase() || "OFFICER";
    case "esas_scholar":
      return "ESAS SCHOLAR";
    case "administrator":
      return "ADMINISTRATOR";
    case "member":
    default:
      return "MEMBER";
  }
}

/** Get badge styling based on designation */
function getDesignationBadgeClass(designation: HsDesignation | null | undefined): string {
  if (!designation) return "bg-black/60 hover:bg-black/60 text-[#FFD700] border border-[#FFD700]/30 text-[9px] font-bold px-2.5 py-0.5 whitespace-nowrap";
  switch (designation.designation) {
    case "esas_scholar":
      return "bg-[#FFD700] hover:bg-[#FFD700] text-black border border-black text-[9px] font-black px-2.5 py-0.5 whitespace-nowrap";
    case "officer":
      return "bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFA500] text-black border border-black/20 text-[9px] font-black px-2.5 py-0.5 whitespace-nowrap";
    case "administrator":
      return "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-600 hover:to-red-500 text-white border border-red-800/30 text-[9px] font-black px-2.5 py-0.5 whitespace-nowrap";
    case "member":
    default:
      return "bg-black/60 hover:bg-black/60 text-[#FFD700] border border-[#FFD700]/30 text-[9px] font-bold px-2.5 py-0.5 whitespace-nowrap";
  }
}

export function QrIdCard({ profile, role, showCompactPreview = true, designation, cardPin }: QrIdCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const displayName = profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Member";
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "HS";

  const getAvatarDisplayUrl = (avatarUrl: string | null | undefined) => {
    if (!avatarUrl) return undefined;
    if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
      return avatarUrl;
    }
    if (avatarUrl.startsWith("avatars/")) {
      return `/api/avatar?pathname=${encodeURIComponent(avatarUrl)}`;
    }
    return avatarUrl;
  };

  // Resolve designation: prop > profile.hs_designations current > fallback
  const currentDesignation = designation 
    || profile.hs_designations?.find(d => d.is_current) 
    || null;
  const designationLabel = getDesignationLabel(currentDesignation);
  const designationBadgeClass = getDesignationBadgeClass(currentDesignation);

  // Always show the CURRENT president, not the one from when the member joined
  const currentAcademicYear = "2025-2026";
  const presidentName = getPresidentName(currentAcademicYear);
  const formattedRole = designationLabel;
  
  const birthdateStr = profile.birthdate || profile.date_of_birth;
  const formattedBirthdate = birthdateStr
    ? new Date(birthdateStr).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase()
    : "N/A";

  // Generate the QR payload
  const qrPayload = cardPin && profile.unique_id_number
    ? JSON.stringify({ cardId: profile.unique_id_number, pin: cardPin })
    : "PENDING";

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      const htmlToImage = await import("html-to-image");
      const element = document.getElementById(`print-id-card-${profile.id}`);
      if (!element) {
        console.error("Print card element not found");
        return;
      }
      
      const dataUrl = await htmlToImage.toPng(element, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: '#09090b', // zinc-950
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          opacity: '1',
          position: 'relative',
          zIndex: '1',
        }
      });
      
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `cit_u_hs_id_${profile.unique_id_number || "card"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error generating ID card image", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const printLayout = (
    <div 
      id={`print-id-card-${profile.id}`} 
      className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none flex gap-5 bg-zinc-950 p-6 rounded-3xl"
      style={{ width: "680px", height: "528px" }}
    >
      {/* FRONT SIDE (FLAT) */}
      <div className="w-[320px] h-[480px] rounded-2xl p-5 flex flex-col justify-between border-2 border-[#FFD700]/30 shadow-2xl overflow-hidden bg-gradient-to-br from-[#1a1a1a] via-[#111111] to-black text-white relative">
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none flex items-center justify-center">
          <HonorSocietyLogo variant="white" className="w-80 h-80" />
        </div>
        <div className="relative flex items-center gap-3 border-b border-[#FFD700]/20 pb-3">
          <HonorSocietyLogo variant="gold" className="h-9 w-9 drop-shadow" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-extrabold tracking-wider leading-none text-zinc-200">CIT UNIVERSITY</span>
            <span className="text-[12px] font-black tracking-widest text-[#FFD700] leading-none mt-0.5">HONOR SOCIETY</span>
          </div>
        </div>
        <div className="relative flex flex-col items-center gap-3 py-2 z-10">
          <div className="relative">
            <Avatar className="h-28 w-28 border-4 border-[#FFD700] shadow-xl rounded-2xl">
              <AvatarImage src={getAvatarDisplayUrl(profile.avatar_url)} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-zinc-800 to-zinc-950 text-white font-bold text-3xl rounded-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 shadow-lg">
                <Badge className={designationBadgeClass}>
                  {designationLabel}
                </Badge>
              </div>
          </div>
          <div className="text-center space-y-1 mt-1">
            <h2 className="text-xl font-black uppercase tracking-tight text-white drop-shadow leading-tight line-clamp-2 px-1">
              {displayName}
            </h2>
            <div className="inline-block bg-black/40 px-3 py-0.5 rounded border border-[#FFD700]/20">
              <span className="font-mono text-xs font-bold tracking-wider text-[#FFD700]">
                {profile.unique_id_number || "HS-PENDING"}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-black/25 rounded-xl p-3 border border-white/5 space-y-2 text-[10px] text-left z-10">
          <div className="flex justify-between items-start border-b border-white/5 pb-1 gap-2">
            <span className="text-zinc-400 font-medium shrink-0">PROGRAM:</span>
            <span className="font-bold text-zinc-100 uppercase tracking-tight text-right text-[8.5px] leading-tight">
              {profile.degree_program || "TUTORING SYSTEM"}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-1">
            <span className="text-zinc-400 font-medium">STUDENT ID:</span>
            <span className="font-mono font-bold text-zinc-100 text-[9.5px]">
              {profile.membership_number || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-1">
            <span className="text-zinc-400 font-medium">BIRTHDATE:</span>
            <span className="font-bold text-zinc-100 uppercase tracking-wide text-[9.5px]">
              {formattedBirthdate}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 font-medium">JOINED AY:</span>
            <span className="font-bold text-zinc-100 font-mono text-[9.5px]">
              {profile.academic_year_joined || "2024-2025"}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center text-[8px] font-semibold text-zinc-400 border-t border-[#FFD700]/20 pt-2.5">
          <span>OFFICIAL DIGITAL PASS</span>
          <span className="text-[#FFD700] tracking-wider font-extrabold">CEBU, PHILIPPINES</span>
        </div>
      </div>

      {/* BACK SIDE (FLAT) */}
      <div className="w-[320px] h-[480px] rounded-2xl p-5 flex flex-col justify-between border-2 border-[#FFD700]/30 shadow-2xl bg-gradient-to-b from-[#2d2d2d] to-[#1a1a1a] text-white relative">
        <div className="absolute top-8 left-0 right-0 h-10 bg-black/90 z-0 flex items-center justify-center gap-2">
          <HonorSocietyLogo variant="gold" className="w-5 h-5 object-contain" />
          <span className="text-[10px] font-bold tracking-widest leading-none text-[#FFD700] pt-0.5">CIT-U HONOR SOCIETY</span>
        </div>
        <div className="relative z-10 flex items-center justify-center border-b border-white/10 pb-2 mt-12">
          <span className="text-[8px] text-zinc-400 uppercase font-mono leading-none tracking-widest pt-1">SCAN TO LOG SESSIONS</span>
        </div>
        <div className="flex flex-col items-center gap-3 py-4 z-10">
          <div className="p-3 bg-white rounded-xl shadow-inner border border-[#FFD700]/20">
            <QRCodeCanvas
              value={qrPayload}
              size={150}
              level="Q"
              includeMargin={false}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>
          <span className="font-mono text-[9px] text-zinc-400 font-semibold tracking-wider">
            MEMBER RECOGNITION SYSTEM
          </span>
        </div>
        <div className="space-y-4 z-10">
          <p className="text-[8px] text-zinc-400 text-center leading-relaxed px-2 font-medium">
            This digital identification card is non-transferable and remains the property of the Cebu Institute of Technology - University Honor Society. If found, please return to the Student Success Office (SSO) or notify sso@cit.edu.
          </p>
          <div className="flex flex-col items-center border-t border-white/10 pt-3">
            <span className="font-serif italic text-sm text-[#FFD700] tracking-wide leading-none">
              {presidentName}
            </span>
            <div className="w-24 h-px bg-white/20 my-1"></div>
            <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-bold leading-none">
              HONOR SOCIETY PRESIDENT
            </span>
            <span className="text-[6px] text-zinc-500 font-mono mt-0.5">
              AY {profile.academic_year_joined || "2024-2025"}
            </span>
          </div>
        </div>
        <div className="text-[7px] text-zinc-500 text-center border-t border-white/5 pt-2">
          POWERED BY SCHOLARME &copy; 2026
        </div>
      </div>
    </div>
  );

  const cardInnerLayout = (
    <div className={`card-inner w-full h-full relative ${isFlipped ? "card-flipped" : ""}`}>
      {/* FRONT SIDE */}
      <div className="card-front absolute w-full h-full rounded-2xl p-5 flex flex-col justify-between border-2 border-[#FFD700]/30 shadow-2xl overflow-hidden select-none bg-gradient-to-br from-[#1a1a1a] via-[#111111] to-black text-white">
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none flex items-center justify-center">
          <HonorSocietyLogo variant="white" className="w-80 h-80" />
        </div>
        <div className="relative flex items-center gap-3 border-b border-[#FFD700]/20 pb-3">
          <HonorSocietyLogo variant="gold" className="h-9 w-9 drop-shadow" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-extrabold tracking-wider leading-none text-zinc-200">CIT UNIVERSITY</span>
            <span className="text-[12px] font-black tracking-widest text-[#FFD700] leading-none mt-0.5">HONOR SOCIETY</span>
          </div>
        </div>
        <div className="relative flex flex-col items-center gap-3 py-2 z-10">
          <div className="relative">
            <Avatar className="h-28 w-28 border-4 border-[#FFD700] shadow-xl rounded-2xl">
              <AvatarImage src={getAvatarDisplayUrl(profile.avatar_url)} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-zinc-800 to-zinc-950 text-white font-bold text-3xl rounded-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 shadow-lg">
                <Badge className={designationBadgeClass}>
                  {designationLabel}
                </Badge>
              </div>
          </div>
          <div className="text-center space-y-1 mt-1">
            <h2 className="text-xl font-black uppercase tracking-tight text-white drop-shadow leading-tight line-clamp-2 px-1">
              {displayName}
            </h2>
            <div className="inline-block bg-black/40 px-3 py-0.5 rounded border border-[#FFD700]/20">
              <span className="font-mono text-xs font-bold tracking-wider text-[#FFD700]">
                {profile.unique_id_number || "HS-PENDING"}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-black/25 rounded-xl p-3 border border-white/5 space-y-2 text-[10px] text-left z-10">
          <div className="flex justify-between items-start border-b border-white/5 pb-1 gap-2">
            <span className="text-zinc-400 font-medium shrink-0">PROGRAM:</span>
            <span className="font-bold text-zinc-100 uppercase tracking-tight text-right text-[8.5px] leading-tight">
              {profile.degree_program || "TUTORING SYSTEM"}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-1">
            <span className="text-zinc-400 font-medium">STUDENT ID:</span>
            <span className="font-mono font-bold text-zinc-100 text-[9.5px]">
              {profile.membership_number || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-1">
            <span className="text-zinc-400 font-medium">BIRTHDATE:</span>
            <span className="font-bold text-zinc-100 uppercase tracking-wide text-[9.5px]">
              {formattedBirthdate}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 font-medium">JOINED AY:</span>
            <span className="font-bold text-zinc-100 font-mono text-[9.5px]">
              {profile.academic_year_joined || "2024-2025"}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center text-[8px] font-semibold text-zinc-400 border-t border-[#FFD700]/20 pt-2.5">
          <span>OFFICIAL DIGITAL PASS</span>
          <span className="text-[#FFD700] tracking-wider font-extrabold">CEBU, PHILIPPINES</span>
        </div>
      </div>

      {/* BACK SIDE */}
      <div className="card-back absolute w-full h-full rounded-2xl p-5 flex flex-col justify-between border-2 border-[#FFD700]/30 shadow-2xl select-none bg-gradient-to-b from-[#2d2d2d] to-[#1a1a1a] text-white">
        <div className="absolute top-8 left-0 right-0 h-10 bg-black/90 z-0 flex items-center justify-center gap-2">
          <HonorSocietyLogo variant="gold" className="w-5 h-5 object-contain" />
          <span className="text-[10px] font-bold tracking-widest leading-none text-[#FFD700] pt-0.5">CIT-U HONOR SOCIETY</span>
        </div>
        <div className="relative z-10 flex items-center justify-center border-b border-white/10 pb-2 mt-12">
          <span className="text-[8px] text-zinc-400 uppercase font-mono leading-none tracking-widest pt-1">SCAN TO LOG SESSIONS</span>
        </div>
        <div className="flex flex-col items-center gap-3 py-4 z-10">
          <div className="p-3 bg-white rounded-xl shadow-inner border border-[#FFD700]/20">
            <QRCodeCanvas
              value={qrPayload}
              size={150}
              level="Q"
              includeMargin={false}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>
          <span className="font-mono text-[9px] text-zinc-400 font-semibold tracking-wider">
            MEMBER RECOGNITION SYSTEM
          </span>
        </div>
        <div className="space-y-4 z-10">
          <p className="text-[8px] text-zinc-400 text-center leading-relaxed px-2 font-medium">
            This digital identification card is non-transferable and remains the property of the Cebu Institute of Technology - University Honor Society. If found, please return to the Student Success Office (SSO) or notify sso@cit.edu.
          </p>
          <div className="flex flex-col items-center border-t border-white/10 pt-3">
            <span className="font-serif italic text-sm text-[#FFD700] tracking-wide leading-none">
              {presidentName}
            </span>
            <div className="w-24 h-px bg-white/20 my-1"></div>
            <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-bold leading-none">
              HONOR SOCIETY PRESIDENT
            </span>
            <span className="text-[6px] text-zinc-500 font-mono mt-0.5">
              AY {profile.academic_year_joined || "2024-2025"}
            </span>
          </div>
        </div>
        <div className="text-[7px] text-zinc-500 text-center border-t border-white/5 pt-2">
          POWERED BY SCHOLARME &copy; 2026
        </div>
      </div>
    </div>
  );

  const controlsLayout = (
    <div className="flex flex-col items-center gap-2 w-full mt-2">
      <div className="flex gap-2 w-full">
        <Button 
          onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
          variant="outline" 
          size="sm" 
          className="flex-1 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white text-zinc-200 gap-2 font-semibold"
        >
          <RotateCw className="h-4 w-4 text-[#FFD700]" />
          Flip Card
        </Button>

        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          variant="outline"
          size="sm"
          className="flex-1 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white text-zinc-200 gap-2 font-semibold"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 text-[#FFD700] animate-spin" />
          ) : (
            <Download className="h-4 w-4 text-[#FFD700]" />
          )}
          {isDownloading ? "Downloading..." : "Download ID"}
        </Button>
      </div>
      <p className="text-[10px] text-zinc-400 text-center">
        Click on the card or click the buttons above to flip/download
      </p>
    </div>
  );

  if (!showCompactPreview) {
    return (
      <div className="flex flex-col items-center gap-6 w-full">
        {printLayout}

        <div className="card-container w-[320px] h-[480px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
          {cardInnerLayout}
        </div>

        {controlsLayout}

        <style jsx global>{`
          .card-container {
            perspective: 1200px;
          }
          .card-inner {
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            transform-style: preserve-3d;
          }
          .card-flipped {
            transform: rotateY(180deg);
          }
          .card-front, .card-back {
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5);
          }
          .card-back {
            transform: rotateY(180deg);
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {/* Compact Interactive ID Preview Card */}
      <Card className="w-full max-w-sm mx-auto overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 p-4 text-white flex flex-col items-center justify-center gap-3 border-b border-[#FFD700]/20 text-center">
          <div className="flex items-center gap-2">
            <HonorSocietyLogo variant="gold" className="h-5 w-5 animate-pulse" />
            <span className="font-bold text-xs tracking-wider uppercase">Honor Society ID</span>
          </div>
          <Badge variant="outline" className="border-[#FFD700]/50 text-[#FFD700] text-[10px] px-3 py-1 font-semibold bg-zinc-900/40 text-center whitespace-normal h-auto break-words leading-tight max-w-full">
            {formattedRole}
          </Badge>
        </div>
        
        <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-[#FFD700] shadow-md">
              <AvatarImage src={getAvatarDisplayUrl(profile.avatar_url)} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-zinc-800 to-zinc-950 text-white font-bold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            {profile.esas_scholar && role === "tutor" && (
              <div className="absolute -bottom-1 -right-1 bg-[#FFD700] text-black text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-black shadow">
                ESAS
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-[#FFD700] transition-colors line-clamp-1">
              {displayName}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              {profile.unique_id_number || "ID Pending"}
            </p>
          </div>

          {/* Open Modal Trigger */}
          <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if(!open) setIsFlipped(false); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full bg-zinc-950 text-white hover:bg-zinc-900 border border-[#FFD700]/30 hover:border-[#FFD700] transition-all duration-300 gap-2 font-semibold">
                <CreditCard className="h-3.5 w-3.5 text-[#FFD700]" />
                View Digital ID Card
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white flex flex-col items-center p-6 gap-4 outline-none overflow-visible relative">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden rounded-lg">
                <HonorSocietyLogo variant="white" className="w-96 h-96" />
              </div>

              <DialogHeader className="text-center w-full relative z-10">
                <DialogTitle className="text-xl font-bold tracking-widest text-center text-[#FFD700] uppercase">
                  Digital Identity Card
                </DialogTitle>
                <DialogDescription className="text-center text-zinc-400 text-xs font-medium">
                  Cebu Institute of Technology - University Honor Society
                </DialogDescription>
              </DialogHeader>

              {/* 3D Flippable Card Frame */}
              <div className="card-container w-[320px] h-[480px] cursor-pointer relative z-10 shrink-0" onClick={() => setIsFlipped(!isFlipped)}>
                {cardInnerLayout}
              </div>

              {/* Instructions and Flip Action Button */}
              <div className="relative z-10 w-full">
                {controlsLayout}
              </div>

              {/* Off-screen print layout */}
              {printLayout}

              {/* Custom CSS for 3D flip card */}
              <style jsx global>{`
                .card-container {
                  perspective: 1200px;
                }
                .card-inner {
                  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                  transform-style: preserve-3d;
                }
                .card-flipped {
                  transform: rotateY(180deg);
                }
                .card-front, .card-back {
                  backface-visibility: hidden;
                  -webkit-backface-visibility: hidden;
                  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5);
                }
                .card-back {
                  transform: rotateY(180deg);
                }
              `}</style>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </>
  );
}
