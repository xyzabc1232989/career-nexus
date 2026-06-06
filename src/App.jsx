import React from "react";
import { useState, useEffect, useRef } from "react";
import supabase from './supabaseClient';
import { askChatbotWithGroq, getSkillRoadmapWithGroq } from "./groqChatbot.js";
import ResumePage from "./ResumePage";
import botLogo from './bot-logo.jpg';
import { 
  Plus, X, Briefcase, GraduationCap, Globe, LayoutGrid, List, Search, 
  MapPin, Phone, Mail, FileText, CheckCircle2, Sparkles 
} from 'lucide-react';

const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// ── Bot logo (base64) — middle crop removes the black square background ─────────
const BOT_LOGO_B64 = "/9j/4AAQSkZJRgABAQEBLAEsAAD/4QDcRXhpZgAASUkqAAgAAAADAA4BAgCSAAAAMgAAABoBBQABAAAAxAAAABsBBQABAAAAzAAAAAAAAABBYnN0cmFjdCBDaXJjbGUgd2l0aCBBSSBUZXh0IExvZ28gZm9yIEZ1dHVyaXN0aWMgcmVwcmVzZW50aW5nIEFydGlmaWNpYWwgSW50ZWxsaWdlbmNlIHVzaW5nIEJpZyBEYXRhIFRlY2ggQ29uY2VwdCB3aXRoaW4gVmlicmFudCBGbHVpZCBCYWNrZ3JvdW5kLiwBAAABAAAALAEAAAEAAAD/4QYAaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIj4KCTxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CgkJPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczpJcHRjNHhtcENvcmU9Imh0dHA6Ly9pcHRjLm9yZy9zdGQvSXB0YzR4bXBDb3JlLzEuMC94bWxucy8iICAgIHhtbG5zOkdldHR5SW1hZ2VzR0lGVD0iaHR0cDovL3htcC5nZXR0eWltYWdlcy5jb20vZ2lmdC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBsdXM9Imh0dHA6Ly9ucy51c2VwbHVzLm9yZy9sZGYveG1wLzEuMC8iICB4bWxuczppcHRjRXh0PSJodHRwOi8vaXB0Yy5vcmcvc3RkL0lwdGM0eG1wRXh0LzIwMDgtMDItMjkvIiB4bWxuczp4bXBSaWdodHM9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9yaWdodHMvIiBwaG90b3Nob3A6Q3JlZGl0PSJHZXR0eSBJbWFnZXMiIEdldHR5SW1hZ2VzR0lGVDpBc3NldElEPSIyMjE4MTY3MjU1IiB4bXBSaWdodHM6V2ViU3RhdGVtZW50PSJodHRwczovL3d3dy5pc3RvY2twaG90by5jb20vbGVnYWwvbGljZW5zZS1hZ3JlZW1lbnQ/dXRtX21lZGl1bT1vcmdhbmljJmFtcDt1dG1fc291cmNlPWdvb2dsZSZhbXA7dXRtX2NhbXBhaWduPWlwdGN1cmwiIHBsdXM6RGF0YU1pbmluZz0iaHR0cDovL25zLnVzZXBsdXMub3JnL2xkZi92b2NhYi9ETUktUFJPSElCSVRFRC1FWENFUFRTRUFSQ0hFTkdJTkVJTkRFWElORyIgPgo8ZGM6Y3JlYXRvcj48cmRmOlNlcT48cmRmOmxpPm51ZGRzczwvcmRmOmxpPjwvcmRmOlNlcT48L2RjOmNyZWF0b3I+PGRjOmRlc2NyaXB0aW9uPjxyZGY6QWx0PjxyZGY6bGkgeG1sOmxhbmc9IngtZGVmYXVsdCI+QWJzdHJhY3QgQ2lyY2xlIHdpdGggQUkgVGV4dCBMb2dvIGZvciBGdXR1cmlzdGljIHJlcHJlc2VudGluZyBBcnRpZmljaWFsIEludGVsbGlnZW5jZSB1c2luZyBCaWcgRGF0YSBUZWNOQ29uY2VwdCB3aXRoaW4gVmlicmFudCBGbHVpZCBCYWNrZ3JvdW5kLjwvcmRmOmxpPjwvcmRmOkFsdD48L2RjOmRlc2NyaXB0aW9uPgo8cGx1czpMaWNlbnNvcj48cmRmOlNlcT48cmRmOmxpIHJkZjpwYXJzZVR5cGU9J1Jlc291cmNlJz48cGx1czpMaWNlbnNvclVSTD5odHRwczovL3d3dy5pc3RvY2twaG90by5jb20vcGhvdG8vbGljZW5zZS1nbTIyMTgxNjcyNTUtP3V0bV9tZWRpdW09b3JnYW5pYyZhbXA7dXRtX3NvdXJjZT1nb29nbGUmYW1wO3V0bV9jYW1wYWlnbj1pcHRjdXJsPC9wbHVzOkxpY2Vuc29yVVJMPjwvcmRmOmxpPjwvcmRmOlNlcT48L3BsdXM6TGljZW5zb3I+CgkJPC9yZGY6RGVzY3JpcHRpb24+Cgk8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJ3Ij8+";

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? "http://localhost:8000" 
    : `http://${window.location.hostname}:8000`);

async function hashPassword(password) {
  if (!password) return "";
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const T = {
  bg: "#F7F8FC",
  surface: "#FFFFFF",
  surfaceHover: "#F1F4FD",
  border: "#E4E9F2",
  borderHover: "#C7D2E8",
  text: "#0D1321",
  textSecondary: "#4A5568",
  textMuted: "#94A3B8",
  indigo: "#4338CA",
  indigoLight: "#6366F1",
  indigoPale: "#EEF2FF",
  indigoPaleHover: "#E0E7FF",
  teal: "#0D9488",
  tealPale: "#F0FDFA",
  amber: "#B45309",
  amberPale: "#FFFBEB",
  success: "#059669",
  danger: "#DC2626",
  shadow: "0 1px 4px rgba(13,19,33,0.06), 0 4px 16px rgba(13,19,33,0.06)",
  shadowHover: "0 4px 12px rgba(13,19,33,0.08), 0 12px 40px rgba(13,19,33,0.1)",
  glowIndigo: "0 0 0 3px rgba(67,56,202,0.14)",
  glowIndigoBtn: "0 4px 20px rgba(67,56,202,0.28), 0 0 0 1px rgba(67,56,202,0.15)",
  font: "'Sora', sans-serif",
  fontBody: "'DM Sans', sans-serif",
};

const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{background:${T.bg};color:${T.text};font-family:${T.fontBody};-webkit-font-smoothing:antialiased;}
  ::-webkit-scrollbar{width:5px;}
  ::-webkit-scrollbar-track{background:#f1f1f1;}
  ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px;}

  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes cardReveal{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes scaleCheck{from{transform:translate(-50%,-50%) scale(0.5);opacity:0}to{transform:translate(-50%,-50%) scale(1);opacity:1}}
  @keyframes barFill{to{transform:scaleX(1)}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes logoGlow{0%,100%{filter:drop-shadow(0 0 6px rgba(99,102,241,0.5))}50%{filter:drop-shadow(0 0 14px rgba(99,102,241,0.85))}}
  @keyframes btnShine{0%{transform:translateX(-100%) skewX(-15deg)}100%{transform:translateX(200%) skewX(-15deg)}}
  @keyframes fabPulse{0%,100%{box-shadow:0 4px 20px rgba(67,56,202,0.4),0 0 0 0 rgba(99,102,241,0.5)}70%{box-shadow:0 4px 20px rgba(67,56,202,0.4),0 0 0 12px rgba(99,102,241,0)}}

  .fadeup-1{animation:fadeUp .6s .05s both cubic-bezier(.22,.68,0,1.2);}
  .fadeup-2{animation:fadeUp .6s .15s both cubic-bezier(.22,.68,0,1.2);}
  .fadeup-3{animation:fadeUp .6s .25s both cubic-bezier(.22,.68,0,1.2);}
  .fadeup-4{animation:fadeUp .6s .38s both cubic-bezier(.22,.68,0,1.2);}
  .fadeup-5{animation:fadeUp .6s .52s both cubic-bezier(.22,.68,0,1.2);}
  .page-in{animation:fadeIn .35s ease both;}
  .card-in{animation:cardReveal .45s ease both;}

  /* NAV */
  .nav{position:sticky;top:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:0 40px;height:64px;background:rgba(247,248,252,0.92);backdrop-filter:blur(16px);border-bottom:1px solid ${T.border};box-sizing:border-box;width:100%;}

  /* ── LOGO ── */
  .nav-logo{display:flex;background:None;align-items:center;gap:10px;font-family:${T.font};font-weight:800;font-size:16px;color:${T.text};cursor:pointer;user-select:none;letter-spacing:-0.02em;text-decoration:none;}
  .nav-logo-mark{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#4338CA 0%,#6366F1 50%,#0D9488 100%);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(67,56,202,0.35);animation:logoGlow 3s ease-in-out infinite;}
  .nav-logo-text{background:linear-gradient(135deg,${T.indigo},${T.teal});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}

  .nav-links{display:flex;gap:2px;align-items:center;}
  .nav-link{font-family:${T.fontBody};font-size:14px;font-weight:500;color:${T.textSecondary};background:none;border:none;padding:7px 14px;border-radius:8px;cursor:pointer;transition:color .18s,background .18s;letter-spacing:-0.01em;}
  .nav-link:hover{color:${T.text};background:${T.border};}
  .nav-link.active{color:${T.indigo};background:${T.indigoPale};}

  /* ── PRIMARY CTA BUTTON ── */
  .nav-cta{position:relative;overflow:hidden;font-family:${T.fontBody};font-weight:700;font-size:14px;background:linear-gradient(135deg,#4338CA,#6366F1);color:#fff;border:none;padding:10px 22px;border-radius:10px;cursor:pointer;transition:transform .2s,box-shadow .2s;letter-spacing:-0.01em;box-shadow:0 2px 12px rgba(67,56,202,0.35);}
  .nav-cta::after{content:'';position:absolute;top:0;left:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);transform:translateX(-100%) skewX(-15deg);}
  .nav-cta:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(67,56,202,0.5);}
  .nav-cta:hover::after{animation:btnShine .6s ease forwards;}

  /* SHARED */
  .section-label{font-family:${T.font};font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${T.indigo};margin-bottom:12px;}
  .grad-text{background:linear-gradient(135deg,${T.indigo},${T.teal});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}

  /* ── IMPROVED PRIMARY BUTTON ── */
  .btn-primary{position:relative;overflow:hidden;font-family:${T.fontBody};font-weight:700;font-size:14px;background:linear-gradient(135deg,#4338CA 0%,#6366F1 100%);color:#fff;border:none;padding:13px 30px;border-radius:12px;cursor:pointer;transition:transform .2s,box-shadow .2s;letter-spacing:-0.01em;box-shadow:0 4px 16px rgba(67,56,202,0.4);display:inline-flex;align-items:center;gap:7px;}
  .btn-primary::after{content:'';position:absolute;top:0;left:0;width:45%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);transform:translateX(-100%) skewX(-15deg);}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(67,56,202,0.55);}
  .btn-primary:hover::after{animation:btnShine .7s ease forwards;}
  .btn-primary:active{transform:translateY(0);box-shadow:0 2px 8px rgba(67,56,202,0.35);}

  /* ── IMPROVED SECONDARY BUTTON ── */
  .btn-secondary{font-family:${T.fontBody};font-weight:600;font-size:14px;background:${T.surface};color:${T.indigo};border:1.5px solid #C7D7FD;padding:13px 30px;border-radius:12px;cursor:pointer;transition:background .2s,border-color .2s,transform .2s,box-shadow .2s;display:inline-flex;align-items:center;gap:7px;}
  .btn-secondary:hover{background:${T.indigoPale};border-color:${T.indigoLight};transform:translateY(-2px);box-shadow:0 4px 16px rgba(67,56,202,0.15);}
  .btn-secondary:active{transform:translateY(0);}

  /* HERO */
  .hero{position:relative;overflow:hidden;padding:90px 24px 80px;text-align:center;background:${T.surface};border-bottom:1px solid ${T.border};width:100%;}
  .hero-badge{display:inline-flex;align-items:center;gap:7px;font-family:${T.fontBody};font-size:13px;font-weight:500;padding:6px 14px;border-radius:999px;background:${T.indigoPale};border:1px solid #C7D7FD;color:${T.indigo};margin-bottom:24px;}
  .hero-dot{width:7px;height:7px;border-radius:50%;background:${T.indigoLight};animation:pulse 2s ease-in-out infinite;}
  .hero h1{font-family:${T.font};font-size:clamp(2.4rem,5vw,3.8rem);font-weight:800;line-height:1.07;letter-spacing:-0.035em;color:${T.text};margin-bottom:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;}
  .hero p{font-size:clamp(1rem,2vw,1.1rem);color:${T.textSecondary};max-width:520px;margin:0 auto 36px;line-height:1.7;font-weight:400;}
  .hero-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
  .hero-stats{display:flex;gap:0;justify-content:center;margin-top:60px;flex-wrap:wrap;border-top:1px solid ${T.border};padding-top:40px;max-width:600px;margin-left:auto;margin-right:auto;}
  .stat-item{flex:1;padding:0 32px;text-align:center;}
  .stat-item+.stat-item{border-left:1px solid ${T.border};}
  .stat-num{font-family:${T.font};font-size:28px;font-weight:800;color:${T.indigo};letter-spacing:-0.03em;}
  .stat-lbl{font-size:12px;color:${T.textMuted};margin-top:4px;font-weight:500;}
  .hero-bg-ring{position:absolute;border-radius:50%;pointer-events:none;border:1px solid rgba(67,56,202,0.06);}

  /* HOW IT WORKS */
  .steps-wrap{width:100%;padding:80px 24px;}
  .steps-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1px;background:${T.border};border:1px solid ${T.border};border-radius:16px;overflow:hidden;margin-top:48px;margin-left:auto;margin-right:auto;max-width:1060px;}
  .step-card{background:${T.surface};padding:36px 28px;transition:background .2s;}
  .step-card:hover{background:${T.indigoPale};}
  .step-num{font-family:${T.font};font-size:11px;font-weight:700;letter-spacing:.12em;color:${T.textMuted};margin-bottom:20px;text-transform:uppercase;}
  .step-icon-wrap{width:44px;height:44px;background:${T.indigoPale};border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;}
  .step-title{font-family:${T.font};font-size:17px;font-weight:700;color:${T.text};margin-bottom:10px;letter-spacing:-0.02em;}
  .step-desc{font-size:14px;color:${T.textSecondary};line-height:1.7;}

  /* STATS BANNER */
  .stats-banner{width:100%;padding:0 24px 80px;}
  .stats-inner{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));border:1px solid ${T.border};border-radius:16px;background:${T.surface};box-shadow:${T.shadow};overflow:hidden;max-width:960px;margin-left:auto;margin-right:auto;}
  .stat-banner-item{padding:32px 24px;text-align:center;border-right:1px solid ${T.border};}
  .stat-banner-item:last-child{border-right:none;}
  .stat-banner-num{font-family:${T.font};font-size:28px;font-weight:800;color:${T.indigo};letter-spacing:-0.04em;}
  .stat-banner-lbl{font-size:12px;color:${T.textMuted};margin-top:6px;font-weight:500;text-transform:uppercase;letter-spacing:.06em;}

  /* FEATURES */
  .features-wrap{width:100%;padding:0 24px 80px;}
  .features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-top:48px;max-width:1060px;margin-left:auto;margin-right:auto;}
  .feat-card{background:${T.surface};border:1px solid ${T.border};border-radius:16px;padding:28px;transition:box-shadow .25s,border-color .25s,transform .25s;}
  .feat-card:hover{box-shadow:${T.shadowHover};border-color:${T.borderHover};transform:translateY(-4px);}
  .feat-icon-box{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;}
  .feat-tag{font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:${T.indigoPale};color:${T.indigo};border:1px solid #C7D7FD;letter-spacing:.04em;}
  .feat-title{font-family:${T.font};font-size:16px;font-weight:700;color:${T.text};margin-bottom:8px;letter-spacing:-0.02em;}
  .feat-desc{font-size:13px;color:${T.textSecondary};line-height:1.7;}

  /* TESTIMONIALS */
  .testi-wrap{width:100%;padding:0 24px 80px;max-width:760px;margin-left:auto;margin-right:auto;}
  .testi-card{background:${T.surface};border:1px solid ${T.border};border-radius:20px;padding:40px;box-shadow:${T.shadow};position:relative;transition:opacity .3s,transform .3s;}
  .testi-text{font-size:17px;color:${T.text};line-height:1.7;margin-bottom:28px;font-style:italic;font-weight:400;}
  .testi-avatar{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:${T.font};font-weight:700;font-size:13px;flex-shrink:0;}
  .testi-name{font-family:${T.font};font-weight:700;font-size:15px;color:${T.text};letter-spacing:-0.01em;text-align:center;}
  .testi-role{font-size:13px;color:${T.textMuted};margin-top:2px;text-align:center;}
  .testi-dots{display:flex;justify-content:center;gap:6px;margin-top:28px;}
  .tdot{height:6px;border-radius:99px;cursor:pointer;transition:width .3s,background .3s;}
  .tdot.on{width:24px;background:${T.indigo};}
  .tdot:not(.on){width:6px;background:${T.border};}

  /* CTA SECTION */
  .cta-wrap{width:100%;padding:0 24px 80px;}
  .cta-box{background:linear-gradient(135deg,#3730A3 0%,#4338CA 50%,#0D9488 100%);border-radius:20px;padding:64px 48px;text-align:center;position:relative;overflow:hidden;max-width:900px;margin-left:auto;margin-right:auto;}
  .cta-box h2{font-family:${T.font};font-size:clamp(1.8rem,4vw,2.6rem);font-weight:800;color:#fff;letter-spacing:-0.03em;margin-bottom:14px;}
  .cta-box p{color:rgba(255,255,255,.75);font-size:16px;margin-bottom:32px;line-height:1.6;}

  /* ── WHITE CTA BUTTON ── */
  .btn-white{position:relative;overflow:hidden;font-family:${T.fontBody};font-weight:700;font-size:14px;background:#fff;color:${T.indigo};border:none;padding:14px 34px;border-radius:12px;cursor:pointer;transition:transform .2s,box-shadow .2s;box-shadow:0 4px 16px rgba(0,0,0,0.15);display:inline-flex;align-items:center;gap:7px;}
  .btn-white::after{content:'';position:absolute;top:0;left:0;width:45%;height:100%;background:linear-gradient(90deg,transparent,rgba(67,56,202,0.08),transparent);transform:translateX(-100%) skewX(-15deg);}
  .btn-white:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,0.22);}
  .btn-white:hover::after{animation:btnShine .7s ease forwards;}

  .auth-wrap{width:100%;padding:40px 24px 80px;max-width:980px;margin:0 auto;}
  .auth-card{background:${T.surface};border:1px solid ${T.border};border-radius:24px;padding:32px;box-shadow:${T.shadow};max-width:520px;margin:0 auto;}
  .auth-card h2{font-family:${T.font};font-size:clamp(1.75rem,3.5vw,2.2rem);font-weight:800;margin-bottom:10px;color:${T.text};}
  .auth-card p{color:${T.textSecondary};line-height:1.75;margin-bottom:24px;}
  .auth-field{width:100%;margin-bottom:18px;}
  .auth-field label{display:block;font-size:13px;font-weight:700;color:${T.textSecondary};margin-bottom:8px;}
  .auth-field input{width:100%;padding:14px 16px;border:1px solid ${T.border};border-radius:12px;background:${T.bg};font-family:${T.fontBody};font-size:14px;color:${T.text};outline:none;transition:border-color .2s,box-shadow .2s;}
  .auth-field input:focus{border-color:${T.indigoLight};box-shadow:${T.glowIndigo};}
  .auth-actions{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-top:10px;}
  .auth-toggle{font-size:13px;color:${T.indigo};cursor:pointer;text-decoration:underline;}
  .auth-error{font-size:14px;color:${T.danger};margin-top:10px;}
  .auth-modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;}
  .auth-modal-content{position:relative;max-width:520px;width:90%;max-height:90vh;overflow-y:auto;}
  .auth-close{position:absolute;top:10px;right:10px;width:30px;height:30px;background:${T.surface};border:1px solid ${T.border};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;color:${T.text};cursor:pointer;z-index:1001;}

  /* FOOTER */
  .footer{border-top:1px solid ${T.border};background:${T.surface};padding:52px 40px 32px;}
  .footer-inner{max-width:1100px;margin:0 auto;}
  .footer-grid{display:grid;grid-template-columns:1.8fr 1fr 1fr 1fr;gap:40px;margin-bottom:48px;}
  .footer-brand-desc{font-size:13px;color:${T.textMuted};line-height:1.7;margin-top:12px;max-width:220px;}
  .footer-col h4{font-family:${T.font};font-size:13px;font-weight:700;color:${T.text};margin-bottom:16px;letter-spacing:-0.01em;}
  .footer-col a{display:block;font-size:13px;color:${T.textMuted};text-decoration:none;margin-bottom:10px;cursor:pointer;transition:color .18s;}
  .footer-col a:hover{color:${T.indigo};}
  .footer-bottom{border-top:1px solid ${T.border};padding-top:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;}
  .footer-bottom p{font-size:12px;color:${T.textMuted};}
  .footer-socials{display:flex;gap:16px;}
  .footer-socials a{font-size:12px;color:${T.textMuted};text-decoration:none;cursor:pointer;transition:color .18s;}
  .footer-socials a:hover{color:${T.indigo};}

  /* JOBS PAGE */
  .jobs-header{background:${T.surface};border-bottom:1px solid ${T.border};padding:40px 40px 32px;}
  .jobs-header-inner{max-width:1100px;margin:0 auto;text-align:center;}
  .jobs-h1{font-family:${T.font};font-size:clamp(28px,4vw,44px);font-weight:800;letter-spacing:-0.04em;line-height:1.05;color:${T.text};margin-bottom:10px;}
  .jobs-subtitle{font-size:15px;color:${T.textSecondary};max-width:460px;line-height:1.6;margin:0 auto;}
  .live-pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:${T.teal};background:${T.tealPale};border:1px solid #99F6E4;padding:4px 12px;border-radius:999px;}
  .live-dot{width:6px;height:6px;border-radius:50%;background:${T.teal};animation:pulse 2s infinite;}
  .jobs-kpi-row{display:flex;justify-content:center;gap:36px;margin-top:28px;padding-top:24px;border-top:1px solid ${T.border};}
  .kpi-num{font-family:${T.font};font-size:22px;font-weight:800;color:${T.text};letter-spacing:-0.03em;}
  .kpi-lbl{font-size:11px;color:${T.textMuted};text-transform:uppercase;letter-spacing:.08em;margin-top:2px;}
  .jobs-body{max-width:1100px;margin:0 auto;padding:28px 40px 80px;}

  .search-box{position:relative;flex:1;min-width:220px;}
  .search-box input{width:100%;padding:11px 16px 11px 42px;background:${T.surface};border:1px solid ${T.border};border-radius:10px;font-family:${T.fontBody};font-size:14px;color:${T.text};outline:none;transition:border-color .2s,box-shadow .2s;}
  .search-box input:focus{border-color:${T.indigoLight};box-shadow:${T.glowIndigo};}
  .search-box input::placeholder{color:${T.textMuted};}
  .search-icon-wrap{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:${T.textMuted};pointer-events:none;}
  .filter-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;}
  .filter-chip{font-family:${T.fontBody};font-size:13px;font-weight:500;padding:7px 14px;border-radius:8px;border:1px solid ${T.border};background:${T.surface};color:${T.textSecondary};cursor:pointer;transition:all .18s;white-space:nowrap;}
  .filter-chip:hover{border-color:${T.borderHover};color:${T.text};}
  .filter-chip.on{background:${T.indigoPale};border-color:#C7D7FD;color:${T.indigo};font-weight:600;}
  .sort-select{font-family:${T.fontBody};font-size:13px;padding:9px 14px;border:1px solid ${T.border};border-radius:10px;background:${T.surface};color:${T.text};cursor:pointer;outline:none;transition:border-color .2s;}
  .sort-select:focus{border-color:${T.indigoLight};box-shadow:${T.glowIndigo};}

  .job-card{background:${T.surface};border:1px solid ${T.border};border-radius:14px;padding:24px;transition:box-shadow .25s,border-color .25s,transform .25s;animation:cardReveal .4s ease both;cursor:default;}
  .job-card:hover{box-shadow:${T.shadowHover};border-color:${T.borderHover};transform:translateY(-3px);}
  .job-logo{width:44px;height:44px;border-radius:10px;border:1px solid ${T.border};background:${T.bg};display:flex;align-items:center;justify-content:center;font-family:${T.font};font-size:13px;font-weight:700;color:${T.indigo};flex-shrink:0;}
  .match-badge-high{font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;background:${T.tealPale};color:${T.teal};border:1px solid #99F6E4;}
  .match-badge-mid{font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;background:${T.indigoPale};color:${T.indigo};border:1px solid #C7D7FD;}
  .match-badge-low{font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;background:${T.amberPale};color:${T.amber};border:1px solid #FDE68A;}
  .meta-chip{font-size:12px;color:${T.textSecondary};background:${T.bg};border:1px solid ${T.border};padding:4px 10px;border-radius:6px;}
  .skill-chip{font-size:11px;font-weight:500;padding:3px 9px;border-radius:6px;background:${T.indigoPale};color:${T.indigo};border:1px solid #DBEAFE;}
  .pop-bar-bg{width:72px;height:3px;background:${T.border};border-radius:99px;overflow:hidden;}

  /* ── IMPROVED APPLY BUTTON ── */
  .apply-btn{position:relative;overflow:hidden;font-family:${T.fontBody};font-weight:700;font-size:13px;padding:9px 20px;background:linear-gradient(135deg,#4338CA,#6366F1);color:#fff;border:none;border-radius:9px;cursor:pointer;transition:transform .2s,box-shadow .2s;letter-spacing:-0.01em;box-shadow:0 2px 10px rgba(67,56,202,0.3);}
  .apply-btn::after{content:'';position:absolute;top:0;left:0;width:45%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);transform:translateX(-100%) skewX(-15deg);}
  .apply-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 16px rgba(67,56,202,0.45);}
  .apply-btn:hover:not(:disabled)::after{animation:btnShine .6s ease forwards;}
  .apply-btn.done{background:linear-gradient(135deg,#059669,#10B981);box-shadow:0 2px 10px rgba(5,150,105,0.3);}
  .apply-btn:disabled{opacity:.7;cursor:default;transform:none;box-shadow:none;}

  .view-toggle{width:32px;height:32px;border-radius:7px;border:1px solid ${T.border};background:${T.surface};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .18s,border-color .18s;}
  .view-toggle.on{background:${T.indigoPale};border-color:#C7D7FD;}
  .jobs-grid2{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;}

  /* DASHBOARD */
  .dash-page{background:${T.bg};min-height:100vh;}
  .dash-card{background:${T.surface};border:1px solid ${T.border};border-radius:16px;padding:32px;box-shadow:${T.shadow};}
  .dash-label{font-family:${T.font};display:block;font-size:12px;font-weight:700;color:${T.textSecondary};margin-bottom:8px;letter-spacing:.04em;text-transform:uppercase;}
  .dash-input{width:100%;background:${T.surface};border:1px solid ${T.border};border-radius:10px;padding:11px 15px;color:${T.text};font-size:14px;font-family:${T.fontBody};outline:none;transition:border-color .2s,box-shadow .2s;box-sizing:border-box;}
  .dash-input:focus{border-color:${T.indigoLight};box-shadow:${T.glowIndigo};}
  .tag-box{display:flex;flex-wrap:wrap;gap:7px;align-items:center;background:${T.surface};border:1px solid ${T.border};border-radius:10px;padding:9px 13px;min-height:46px;transition:border-color .2s,box-shadow .2s;cursor:text;}
  .tag-box:focus-within{border-color:${T.indigoLight};box-shadow:${T.glowIndigo};}
  .skill-tag{display:inline-flex;align-items:center;gap:5px;background:${T.indigoPale};border:1px solid #C7D7FD;color:${T.indigo};border-radius:7px;padding:3px 9px;font-size:13px;font-weight:600;}
  .skill-tag-x{background:none;border:none;color:${T.indigo};cursor:pointer;padding:0;font-size:14px;line-height:1;opacity:.6;}
  .skill-tag-x:hover{opacity:1;}
  .tag-inner-input{background:none;border:none;outline:none;color:${T.text};font-size:14px;min-width:120px;flex:1;font-family:${T.fontBody};}

  /* ── GENERATE BUTTON ── */
  .gen-btn{position:relative;overflow:hidden;width:100%;padding:15px;background:linear-gradient(135deg,#4338CA 0%,#6366F1 60%,#0D9488 100%);color:#fff;border:none;border-radius:12px;font-family:${T.font};font-size:15px;font-weight:700;cursor:pointer;transition:transform .2s,box-shadow .2s;margin-top:8px;letter-spacing:-0.01em;box-shadow:0 4px 18px rgba(67,56,202,0.4);}
  .gen-btn::after{content:'';position:absolute;top:0;left:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent);transform:translateX(-100%) skewX(-15deg);}
  .gen-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 28px rgba(67,56,202,0.55);}
  .gen-btn:hover:not(:disabled)::after{animation:btnShine .8s ease forwards;}
  .gen-btn:disabled{opacity:.4;cursor:default;transform:none;box-shadow:none;}

  .loader-spin{width:48px;height:48px;border:3px solid ${T.border};border-top:3px solid ${T.indigo};border-radius:50%;animation:spin 1s linear infinite;}
  .dash-job-card{background:${T.surface};border:1px solid ${T.border};border-radius:12px;padding:20px;margin-bottom:12px;transition:box-shadow .2s,transform .2s;animation:cardReveal .45s ease both;}
  .dash-job-card:hover{box-shadow:${T.shadowHover};transform:translateY(-2px);}
  .missing-card{background:${T.bg};border:1px solid ${T.border};border-radius:12px;padding:20px;}
  .missing-pill{font-size:13px;font-weight:600;background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;border-radius:7px;padding:5px 12px;animation:cardReveal .4s ease both;}
  .kpi-card{background:${T.surface};border:1px solid ${T.border};border-radius:12px;padding:20px;flex:1;min-width:110px;text-align:center;transition:box-shadow .2s;animation:cardReveal .45s ease both;}
  .kpi-card:hover{box-shadow:${T.shadowHover};}
  .fit-bar-bg{height:3px;background:${T.border};border-radius:99px;overflow:hidden;}

  /* RESUME PAGE WRAPPER */
  .resume-page-host .nav { display: none !important; }

  /* CONTACT */
  .contact-page{min-height:100vh;background:${T.surface};border-bottom:1px solid ${T.border};}
  .cp-card{width:100%;max-width:560px;background:${T.surface};border:1px solid ${T.border};border-radius:20px;padding:44px;box-shadow:${T.shadow};position:relative;overflow:hidden;}
  .cp-top-line{position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${T.indigo},${T.teal});}
  .cp-label{display:block;font-family:${T.font};font-size:12px;font-weight:700;color:${T.textSecondary};margin-bottom:7px;text-transform:uppercase;letter-spacing:.06em;}
  .cp-input{width:100%;background:${T.bg};border:1px solid ${T.border};border-radius:10px;color:${T.text};font-family:${T.fontBody};font-size:14px;padding:11px 15px;outline:none;transition:border-color .2s,background .2s,box-shadow .2s;box-sizing:border-box;}
  .cp-input::placeholder{color:${T.textMuted};}
  .cp-input:focus{border-color:${T.indigoLight};background:${T.surface};box-shadow:${T.glowIndigo};}
  .cp-input:disabled{opacity:.6;}

  /* ── CONTACT SEND BUTTON ── */
  .cp-btn{position:relative;overflow:hidden;width:100%;padding:14px;border:none;border-radius:10px;font-family:${T.fontBody};font-size:14px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#4338CA,#6366F1);color:#fff;transition:transform .2s,box-shadow .2s;letter-spacing:-0.01em;box-shadow:0 4px 16px rgba(67,56,202,0.38);}
  .cp-btn::after{content:'';position:absolute;top:0;left:0;width:45%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);transform:translateX(-100%) skewX(-15deg);}
  .cp-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 26px rgba(67,56,202,0.52);}
  .cp-btn:hover:not(:disabled)::after{animation:btnShine .7s ease forwards;}
  .cp-btn:disabled{opacity:.7;cursor:default;transform:none;box-shadow:none;}
  .cp-btn.success{background:linear-gradient(135deg,#059669,#10B981);box-shadow:0 4px 16px rgba(5,150,105,0.38);}

  .cp-err{font-size:12px;color:#DC2626;margin-top:5px;}
  .cp-spinner{position:absolute;top:50%;left:50%;width:20px;height:20px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;transform:translate(-50%,-50%);}
  .cp-success-wrap{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:8px;animation:scaleCheck .4s cubic-bezier(.34,1.56,.64,1);}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .info-item{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:20px 14px;background:${T.bg};border:1px solid ${T.border};border-radius:12px;transition:border-color .2s;}
  .info-item:hover{border-color:${T.borderHover};}
  .info-icon{width:40px;height:40px;border-radius:10px;background:${T.indigoPale};display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${T.indigo};margin-bottom:4px;}
  .social-btn{width:42px;height:42px;border-radius:10px;border:1px solid ${T.border};background:${T.surface};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;color:${T.textSecondary};font-size:13px;font-weight:700;}
  .social-btn:hover{background:${T.indigoPale};border-color:#C7D7FD;color:${T.indigo};}

  /* ── CHATBOT ── */
  .chatbot-widget{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;}

  /* ── FAB with bot logo image ── */
  .chatbot-fab{width:60px;height:60px;border-radius:50%;background:#0D0D14;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid rgba(99,102,241,0.4);animation:fabPulse 2.5s ease-in-out infinite;transition:transform .2s,border-color .2s;padding:0;}
  .chatbot-fab:hover{transform:scale(1.08);border-color:rgba(99,102,241,0.8);}
  .chatbot-fab img{width:100%;height:100%;object-fit:cover;object-position:center center;transform:scale(1.15);}

  .chat-window{width:360px;height:500px;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border:1px solid ${T.border};border-radius:16px;box-shadow:${T.shadowHover};display:flex;flex-direction:column;overflow:hidden;margin-bottom:16px;animation:fadeUp .3s ease both;transform-origin:bottom right;}
  .chat-header{background:linear-gradient(135deg,#4338CA,#6366F1);color:#fff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;font-family:${T.font};font-weight:700;gap:10px;}
  .chat-header-logo{width:32px;height:32px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,0.3);flex-shrink:0;}
  .chat-header-logo img{width:100%;height:100%;object-fit:cover;object-position:center;transform:scale(1.2);}
  .chat-close{background:none;border:none;color:#fff;cursor:pointer;opacity:0.8;font-size:24px;line-height:1;margin-top:-4px;}
  .chat-close:hover{opacity:1;}
  .chat-messages{flex:1;padding:20px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;background:${T.bg};}
  .chat-msg{max-width:85%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;word-wrap:break-word;}
  .chat-msg.user{background:linear-gradient(135deg,#4338CA,#6366F1);color:#fff;align-self:flex-end;border-bottom-right-radius:4px;}
  .chat-msg.model{background:${T.surface};color:${T.text};align-self:flex-start;border-bottom-left-radius:4px;border:1px solid ${T.border};box-shadow:0 1px 2px rgba(0,0,0,0.05);}
  .chat-input-area{padding:14px;background:${T.surface};border-top:1px solid ${T.border};display:flex;gap:8px;align-items:center;}
  .chat-input{flex:1;background:${T.bg};border:1px solid ${T.border};border-radius:20px;padding:10px 16px;font-family:${T.fontBody};font-size:14px;outline:none;transition:border-color .2s;color:${T.text};}
  .chat-input:focus{border-color:${T.indigoLight};}
  .chat-send{background:linear-gradient(135deg,#4338CA,#6366F1);color:#fff;border:none;width:36px;height:36px;border-radius:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .2s,box-shadow .2s;flex-shrink:0;}
  .chat-send:hover:not(:disabled){transform:scale(1.1);box-shadow:0 2px 10px rgba(67,56,202,0.4);}
  .chat-send:disabled{opacity:0.5;cursor:default;}
  .typing-indicator{display:flex;gap:4px;padding:4px;}
  .typing-dot{width:6px;height:6px;background:${T.textMuted};border-radius:50%;animation:pulse 1.4s infinite;}
  .typing-dot:nth-child(2){animation-delay:0.2s;}
  .typing-dot:nth-child(3){animation-delay:0.4s;}

  @media(max-width:900px){
    .nav{padding:0 20px;}
    .nav-links{display:none;}
    .hero{padding:60px 20px 60px;}
    .stat-item{padding:0 16px;}
    .steps-grid{grid-template-columns:1fr;}
    .footer-grid{grid-template-columns:1fr 1fr;}
    .footer-grid .footer-brand{grid-column:1/-1;}
    .jobs-header{padding:28px 20px;}
    .jobs-body{padding:20px;}
    .info-grid{grid-template-columns:1fr;}
    .cp-card{padding:28px 22px;}
    .dash-card{padding:22px;}
    .cta-box{padding:40px 24px;}
  }
`;

// ── Icons ─────────────────────────────────────────────────────────────────────────
const Icon = {
  // ── Polished logo mark: layered hexagon with inner spark ──
  Logo: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      {/* outer hex */}
      <path d="M10 1.5L17.5 5.5V14.5L10 18.5L2.5 14.5V5.5L10 1.5Z"
        stroke="rgba(255,255,255,0.6)" strokeWidth="1" fill="none" />
      {/* inner filled hex */}
      <path d="M10 4.5L15 7.5V13.5L10 16.5L5 13.5V7.5L10 4.5Z"
        fill="rgba(255,255,255,0.25)" />
      {/* N monogram */}
      <path d="M7.5 7.5V12.5M7.5 7.5L12.5 12.5M12.5 7.5V12.5"
        stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Profile: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.indigo} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
  Brain: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.indigo} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2"/>
    </svg>
  ),
  Map: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.indigo} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/>
      <line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  ),
  Bolt: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.indigo} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Chart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.indigo} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Target: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.indigo} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Star: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.indigo} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.indigo} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  FileText: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.indigo} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  List: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  Grid: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Email: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  Phone: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.12 6.12l.98-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Location: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
};

// ── Helpers & Components for JobsPage ──────────────────────────────────────────
const emptyExp  = () => ({ company: '', position: '', start_date: '', end_date: '', description: '' });
const emptyEdu  = () => ({ institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', description: '' });
const emptyProj = () => ({ name: '', description: '', technologies: '', url: '' });

const DynamicList = ({ items, setter, emptyFn, title, icon: Icon, renderItem }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, borderBottom: `1px solid ${T.border}`, paddingBottom: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: T.indigoPale, color: T.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} />
      </div>
      <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 16, color: T.text }}>{title}</div>
    </div>
    {items.map((item, idx) => (
      <div key={idx} style={{ position: 'relative', padding: 20, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 16 }}>
        <button 
          type="button"
          style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', padding: 4 }} 
          onClick={() => setter(items.filter((_, i) => i !== idx))}
        >
          <X size={16} />
        </button>
        {renderItem(item, idx, (field, val) => {
          const next = [...items];
          next[idx] = { ...next[idx], [field]: val };
          setter(next);
        })}
      </div>
    ))}
    <button 
      type="button"
      className="btn-secondary"
      style={{ borderStyle: 'dashed', width: '100%', justifyContent: 'center' }}
      onClick={() => setter([...items, emptyFn()])}
    >
      <Plus size={16} /> Add {title}
    </button>
  </div>
);

// ── Nav ───────────────────────────────────────────────────────────────────────────
function Nav({ page, navigate, userId, onLogout, onShowAuth }) {
  const links = [
    { id: "home",      label: "Home" },
    { id: "jobs",      label: "Jobs" },
    { id: "resume",    label: "Resume Builder" },
    { id: "contact",   label: "Contact" },
  ];
  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => navigate("home")}>
        <div className="nav-logo-mark"><Icon.Logo /></div>
        <span className="nav-logo-text">Nexus Careers</span>
      </div>
      <div className="nav-links">
        {links.map(l => (
          <button
            key={l.id}
            className={`nav-link${page === l.id ? " active" : ""}`}
            onClick={() => navigate(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>
      {userId ? (
        <button className="nav-cta" onClick={onLogout}>
          Logout
        </button>
      ) : (
        <button className="nav-cta" onClick={onShowAuth}>
          Login
        </button>
      )}
    </nav>
  );
}

// ── Landing ───────────────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { text: "Within three weeks, I had four interviews lined up at top tech companies. The skill gap analysis was remarkably accurate about exactly what I was missing.", name: "Aisha Patel", role: "Software Engineer, Google", initials: "AP", bg: "#EEF2FF", color: "#4338CA" },
  { text: "The AI Resume Builder wrote a summary that got me callbacks from three FAANG companies. I was shocked by how good the output was.", name: "Marcus Chen", role: "PhD Fellow, MIT", initials: "MC", bg: "#F0FDFA", color: "#0D9488" },
  { text: "The career simulator helped me choose between two offers. Seeing the five-year trajectory for each path made the decision crystal clear.", name: "Sofia Rodriguez", role: "Product Manager, Stripe", initials: "SR", bg: "#FFF7ED", color: "#B45309" },
  { text: "Transitioned from biology to data science in eight months. The personalised roadmap was like having a career coach who knew exactly where I was headed.", name: "James Okonkwo", role: "Data Scientist, OpenAI", initials: "JO", bg: "#F0FDF4", color: "#059669" },
];

function LandingPage({ navigate, userId }) {
  const [tidx, setTidx] = useState(0);
  const [tvis, setTvis] = useState(true);
  const [c1, setC1]     = useState(0);
  const [c2, setC2]     = useState(0);
  const [c3, setC3]     = useState(0);

  useEffect(() => {
    const anim = (setter, end, dur) => {
      let start = null;
      const step = ts => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        setter(Math.floor(p * end));
        if (p < 1) requestAnimationFrame(step); else setter(end);
      };
      setTimeout(() => requestAnimationFrame(step), 600);
    };
    anim(setC1, 2, 1200);
    anim(setC2, 50, 1200);
    anim(setC3, 97, 1200);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setTvis(false);
      setTimeout(() => { setTidx(i => (i + 1) % TESTIMONIALS.length); setTvis(true); }, 280);
    }, 4500);
    return () => clearInterval(iv);
  }, []);

  const goT = i => { setTvis(false); setTimeout(() => { setTidx(i); setTvis(true); }, 260); };
  const t = TESTIMONIALS[tidx];

  const features = [
    { icon: <Icon.Target />,   tag: "ML-Powered",  title: "Precision Job Matching",  desc: "97.3% match accuracy using transformer-based models trained on real hiring outcomes and career trajectories." },
    { icon: <Icon.FileText />, tag: "AI-Powered",   title: "Resume Builder",          desc: "AI writes and optimises your bullet points, headline and summary for ATS systems — export a polished PDF in minutes." },
    { icon: <Icon.Bolt />,     tag: "Adaptive",     title: "Skill Gap Analysis",      desc: "Pinpoints exactly what to learn next. Connects you with top courses, certifications and learning paths." },
    { icon: <Icon.Chart />,    tag: "Live Data",    title: "Market Intelligence",     desc: "Live salary benchmarks, hiring trends and demand forecasts tailored to your career path." },
    { icon: <Icon.Map />,      tag: "Predictive",   title: "Career Simulator",        desc: "Model your career five years forward. See how each decision shapes your growth trajectory." },
    { icon: <Icon.Users />,    tag: "Community",    title: "Mentor Network",          desc: "AI-matched mentors from your target industry. One-on-one sessions when you need direction most." },
  ];

  return (
    <div className="page-in" style={{ position: 'relative', zIndex: 1 }}>
      {/* Hero */}
      <div className="hero">
        <div className="hero-bg-ring" style={{ width: 800, height: 800, top: -400, left: '50%', transform: 'translateX(-50%)' }} />
        
        <div className="page-in" style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto" }}>
          
          
          <h1 className="fadeup-2" style={{ marginBottom: 20 }}>
            Build a career that<br />
            <span className="grad-text">actually matters</span>
          </h1>
          
          <p className="fadeup-3" style={{ maxWidth: 540, margin: '0 auto 36px' }}>
            AI-powered career matching and resume building for the next generation of professionals.
          </p>
          
          <div className="hero-btns fadeup-4">
            <button className="btn-primary" onClick={() => navigate("jobs")}>
              Get started free <Icon.ArrowRight />
            </button>
            <button className="btn-secondary" onClick={() => navigate("resume")}>
              Build your resume <Icon.ArrowRight />
            </button>
          </div>

          <div className="hero-stats fadeup-5">
            <div className="stat-item"><div className="stat-num">25K+</div><div className="stat-lbl">Jobs indexed</div></div>
            <div className="stat-item"><div className="stat-num">3K+</div><div className="stat-lbl">Resumes built</div></div>
            <div className="stat-item"><div className="stat-num">89%</div><div className="stat-lbl">Avg Match Accuracy</div></div>
          </div>
        </div>
      </div>





      {/* Process Steps */}
      <div style={{ background: T.bg, padding: "80px 40px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 50 }}>
            <div className="section-label">The Nexus Journey</div>
            <h2 style={{ fontFamily: T.font, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>
              Three steps to your <span className="grad-text">dream career</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 40 }}>
            {[
              {
                num: "01",
                title: "Skill Recommender",
                desc: "Our AI analyzes your profile and recommends the exact skills you need to land high-paying roles in your target field.",
                icon: <Icon.Bolt />
              },
              {
                num: "02",
                title: "Job Recommender",
                desc: "Using semantic vector search, we match your unique profile with thousands of live opportunities that actually fit your talent.",
                icon: <Icon.Target />
              },
              {
                num: "03",
                title: "Resume Maker",
                desc: "Build a world-class resume with our AI that highlights your achievements and passes any ATS with flying colors.",
                icon: <Icon.FileText />
              }
            ].map(s => (
              <div key={s.num} className="fadeup-1" style={{ textAlign: "center", padding: "0 20px" }}>
                <div style={{ 
                  width: 64, height: 64, borderRadius: "18px", background: T.indigoPale, color: T.indigo, 
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
                  boxShadow: "0 8px 24px rgba(99,102,241,0.14)"
                }}>
                  {/* Rendering the icon component */}
                  <div style={{ transform: 'scale(1.4)' }}>{s.icon}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.indigo, letterSpacing: ".12em", marginBottom: 8 }}>PHASE {s.num}</div>
                <h3 style={{ fontFamily: T.font, fontSize: 21, fontWeight: 800, color: T.text, marginBottom: 14 }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: T.textSecondary, lineHeight: 1.8, maxWidth: 300, margin: '0 auto' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* Features / Capabilities */}
      <div className="features-wrap" style={{ padding: "100px 40px", background: T.surface }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div className="section-label">Capabilities</div>
          <h2 style={{ fontFamily: T.font, fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 800, color: T.text, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
            Advanced tools for<br /><span className="grad-text">modern professionals</span>
          </h2>
        </div>
        
        <div className="features-grid" style={{ 
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", 
          maxWidth: 1200, margin: "0 auto" 
        }}>
          {[
            { 
              tag: "ML-Powered", title: "Precision Job Matching", 
              desc: "We use semantic search technology to understand your actual skills and experiences. This means you get job matches that really fit who you are and not just the keywords on your profile.",
              icon: <Icon.Target />
            },
            { 
              tag: "AI-Powered", title: "Resume Builder", 
              desc: "Our AI helps you write better bullet points and summaries that catch the eye of hiring managers. You can build a professional resume and export a clean PDF in just a few minutes.",
              icon: <Icon.FileText />
            },
            { 
              tag: "Adaptive", title: "Skill Gap Analysis", 
              desc: "We look at your target roles and tell you exactly which skills you are missing. It gives you a clear path to follow so you can focus on learning what actually matters for your career.",
              icon: <Icon.Bolt />
            },
            { 
              tag: "Live Data", title: "Market Intelligence", 
              desc: "Stay ahead of the curve with real data on salary ranges and hiring trends in your industry. We help you understand the market so you can negotiate with confidence.",
              icon: <Icon.Chart />
            },
            { 
              tag: "Predictive", title: "Career Simulator", 
              desc: "Map out your professional growth and see where your decisions could take you in the next few years. It is a simple way to plan your future and set realistic goals for yourself.",
              icon: <Icon.Map />
            },
            { 
              tag: "Community", title: "Mentor Network", 
              desc: "Connect with experienced professionals in your field who can give you real world advice. Our system matches you with mentors who can help guide you through your career journey.",
              icon: <Icon.Users />
            }
          ].map(f => (
            <div className="feat-card" key={f.title} style={{ 
              textAlign: "center", padding: "48px 32px", background: T.surface, border: `1px solid ${T.border}`, 
              borderRadius: "20px", transition: "all .3s" 
            }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: "14px", background: T.indigoPale, color: T.indigo, 
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
                boxShadow: "0 6px 16px rgba(99,102,241,0.08)"
              }}>
                <div style={{ transform: 'scale(1.2)' }}>{f.icon}</div>
              </div>
              <span style={{ 
                fontSize: 10, fontWeight: 800, color: T.indigo, background: T.indigoPale, 
                padding: "4px 10px", borderRadius: "99px", letterSpacing: ".05em", textTransform: "uppercase" 
              }}>{f.tag}</span>
              <h3 style={{ fontFamily: T.font, fontSize: 19, fontWeight: 800, color: T.text, margin: "16px 0 12px" }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="testi-wrap">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="section-label">Success stories</div>
          <h2 style={{ fontFamily: T.font, fontSize: "clamp(1.7rem,3.5vw,2.4rem)", fontWeight: 800, color: T.text, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
            Careers transformed,<br /><span className="grad-text">futures redefined</span>
          </h2>
        </div>
        <div className="testi-card" style={{ opacity: tvis ? 1 : 0, transform: tvis ? "translateY(0)" : "translateY(10px)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg,${t.color},transparent)`, borderRadius: "20px 20px 0 0" }} />
          <div className="testi-text">"{t.text}"</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div className="testi-avatar" style={{ background: t.bg, color: t.color }}>{t.initials}</div>
            <div className="testi-name">{t.name}</div>
            <div className="testi-role">{t.role}</div>
          </div>
        </div>
        <div className="testi-dots">
          {TESTIMONIALS.map((_, i) => (
            <div key={i} className={`tdot${tidx === i ? " on" : ""}`} onClick={() => goT(i)} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="cta-wrap">
        <div className="cta-box">
          <div style={{ position: "absolute", inset: 0, opacity: .08, backgroundImage: "radial-gradient(circle at 30% 50%,#fff 0,transparent 50%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <h2>Your career journey<br />starts here.</h2>
            <p>Join 98,000+ people who used Nexus to land their dream role.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn-white" onClick={() => navigate("jobs")}>
                Start for free <Icon.ArrowRight />
              </button>
              <button
                onClick={() => navigate("resume")}
                style={{ fontFamily: T.fontBody, fontWeight: 600, fontSize: 14, background: "transparent", color: "rgba(255,255,255,0.88)", border: "1.5px solid rgba(255,255,255,0.4)", padding: "14px 32px", borderRadius: 12, cursor: "pointer", transition: "all .2s", display: "inline-flex", alignItems: "center", gap: 7 }}
              >
                Build resume <Icon.ArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="nav-logo" style={{ marginBottom: 0 }}>
                <div className="nav-logo-mark"><Icon.Logo /></div>
                <span className="nav-logo-text">Nexus Careers</span>
              </div>
            </div>
            {[
              ["Product",  [["Features", "home"], ["Resume Builder", "resume"], ["Jobs", "jobs"], ["Changelog", "blog"]]],
              ["Company",  [["About", "about"], ["Blog", "blog"], ["Careers", "about"], ["Press", "about"]]],
              ["Legal",    [["Privacy", "privacy"], ["Terms", "terms"], ["Cookies", "cookies"], ["Security", "security"]]],
            ].map(([title, items]) => (
              <div className="footer-col" key={title}>
                <h4>{title}</h4>
                {items.map(([label, route]) => <a key={label} onClick={() => navigate(route)} style={{ cursor: 'pointer' }}>{label}</a>)}
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <p>© 2025 Nexus Careers. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Login Page ───────────────────────────────────────────────────────────────────

function LoginPage({ onLogin, onSignup, navigate, userId, onClose }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      onClose();
      navigate('jobs');
    }
  }, [userId, navigate, onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await onLogin({ email: email.trim(), password });
      } else {
        if (!fullName.trim()) {
          setError('Please enter your full name.');
          return;
        }
        await onSignup({ email: email.trim(), password, full_name: fullName.trim() });
      }
    } catch (err) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <button className="auth-close" onClick={onClose}>×</button>
      <div className="auth-card">
        <div style={{ marginBottom: 18 }}>
          <div className="section-label">{mode === 'login' ? 'Welcome back' : 'Create your account'}</div>
          <h2>{mode === 'login' ? 'Sign in to your account' : 'Sign up for access'}</h2>
          <p>Access personalized job recommendations and resume building tools.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="auth-field">
              <label>Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
            </div>
          )}
          <div className="auth-field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a secure password" />
          </div>

          <div className="auth-actions">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Working…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
            <div className="auth-toggle" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
              {mode === 'login'
                ? 'New here? Sign up'
                : 'Already have an account? Log in'}
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}

// ── Jobs Page ─────────────────────────────────────────────────────────────────────
const JOBS = [
  { id: 1,  title: "Senior Product Designer",    company: "Arc Studios",   abbr: "AS", cat: "Design",       salary: "$130–160k", remote: true,  type: "Full-time", skills: ["Figma", "Design Systems", "UX Research", "Prototyping"],        pop: 97, match: 95, days: 2 },
  { id: 2,  title: "Staff Frontend Engineer",     company: "Vercel",        abbr: "VR", cat: "Engineering",  salary: "$170–210k", remote: true,  type: "Full-time", skills: ["React", "TypeScript", "Next.js", "Performance"],               pop: 99, match: 91, days: 1 },
  { id: 3,  title: "ML Research Scientist",       company: "Cohere AI",     abbr: "CA", cat: "AI / ML",      salary: "$180–240k", remote: false, type: "Full-time", skills: ["PyTorch", "NLP", "Python", "Transformers"],                     pop: 88, match: 72, days: 4 },
  { id: 4,  title: "Growth Marketing Lead",       company: "Linear",        abbr: "LN", cat: "Marketing",    salary: "$110–140k", remote: true,  type: "Full-time", skills: ["SEO", "Content Strategy", "Analytics", "A/B Testing"],         pop: 74, match: 63, days: 6 },
  { id: 5,  title: "DevOps / Platform Engineer",  company: "Planetscale",   abbr: "PS", cat: "Engineering",  salary: "$140–175k", remote: true,  type: "Full-time", skills: ["Kubernetes", "Terraform", "AWS", "CI/CD"],                     pop: 82, match: 80, days: 3 },
  { id: 6,  title: "Head of Data Analytics",      company: "Stripe",        abbr: "ST", cat: "Data",         salary: "$160–200k", remote: false, type: "Full-time", skills: ["SQL", "dbt", "Looker", "Data Modeling"],                       pop: 91, match: 85, days: 2 },
  { id: 7,  title: "iOS Engineer",                company: "Craft Docs",    abbr: "CD", cat: "Engineering",  salary: "$130–155k", remote: true,  type: "Full-time", skills: ["Swift", "SwiftUI", "Combine", "CoreData"],                     pop: 67, match: 58, days: 9 },
  { id: 8,  title: "Brand Designer",              company: "Notion",        abbr: "NT", cat: "Design",       salary: "$115–140k", remote: true,  type: "Full-time", skills: ["Illustrator", "Brand Identity", "Motion Design", "Typography"], pop: 85, match: 78, days: 5 },
  { id: 9,  title: "AI / LLM Engineer",           company: "Jasper",        abbr: "JP", cat: "AI / ML",      salary: "$155–200k", remote: true,  type: "Full-time", skills: ["LangChain", "Python", "Prompt Engineering", "RAG"],            pop: 96, match: 89, days: 1 },
  { id: 10, title: "Product Manager — Platform",  company: "Loom",          abbr: "LM", cat: "Product",      salary: "$135–165k", remote: true,  type: "Full-time", skills: ["Roadmapping", "SQL", "API Design", "Analytics"],               pop: 80, match: 70, days: 4 },
  { id: 11, title: "Data Scientist — Growth",     company: "Figma",         abbr: "FG", cat: "Data",         salary: "$140–170k", remote: true,  type: "Full-time", skills: ["Python", "Statistics", "Causal Inference", "Spark"],           pop: 89, match: 82, days: 3 },
  { id: 12, title: "Founding Engineer",           company: "Stealth AI",    abbr: "SA", cat: "Engineering",  salary: "$150–200k + equity", remote: true, type: "Full-time", skills: ["Full Stack", "TypeScript", "System Design", "Postgres"], pop: 94, match: 87, days: 1 },
];

function JobsPage({ userId, navigate }) {
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [jobMatches, setJobMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // New fields
  const [workExperience, setWorkExperience] = useState([emptyExp()]);
  const [education, setEducation] = useState([emptyEdu()]);
  const [projects, setProjects] = useState([emptyProj()]);
  const [certifications, setCertifications] = useState([]);
  const [certInput, setCertInput] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  // Filter states
  const [minSalary, setMinSalary] = useState('');
  const [contractType, setContractType] = useState('');
  const [contractTime, setContractTime] = useState('');

  // Applied Filter states
  const [appliedMinSalary, setAppliedMinSalary] = useState('');
  const [appliedContractType, setAppliedContractType] = useState('');
  const [appliedContractTime, setAppliedContractTime] = useState('');
  const [appliedCity, setAppliedCity] = useState('');
  const [appliedCountry, setAppliedCountry] = useState('');
  
  // Roadmap states
  const [expandedRoadmap, setExpandedRoadmap] = useState(null);
  const [roadmaps, setRoadmaps] = useState({});
  const [loadingRoadmap, setLoadingRoadmap] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setProfileLoading(true);
    (async () => {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('headline, summary, skills, full_name, work_experience, education, projects, certifications, languages, city, country, location_name')
        .eq('id', userId)
        .single();

      if (!fetchError && data) {
        setHeadline(data.headline || '');
        setSummary(data.summary || '');
        setSkills(Array.isArray(data.skills) ? data.skills : []);
        setWorkExperience(Array.isArray(data.work_experience) && data.work_experience.length ? data.work_experience : [emptyExp()]);
        setEducation(Array.isArray(data.education) && data.education.length ? data.education : [emptyEdu()]);
        setProjects(Array.isArray(data.projects) && data.projects.length ? data.projects : [emptyProj()]);
        setCertifications(Array.isArray(data.certifications) ? data.certifications : []);
        setCity(data.city || '');
        setCountry(data.country || '');
        
        // Also initialize filters with profile values if needed, or keep them empty
        setAppliedCity(data.city || '');
        setAppliedCountry(data.country || '');
      }
      setProfileLoading(false);
    })();
  }, [userId]);

  const addSkill = () => {
    const next = skillInput.trim();
    if (!next || skills.includes(next)) return;
    setSkills([...skills, next]);
    setSkillInput('');
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const addCert = () => {
    const next = certInput.trim();
    if (!next || certifications.includes(next)) return;
    setCertifications([...certifications, next]);
    setCertInput('');
  };

  const removeCert = (certToRemove) => {
    setCertifications(certifications.filter(c => c !== certToRemove));
  };

  const filteredJobs = jobMatches.filter(job => {
    // Only filter if we have a valid salary to compare against
    if (appliedMinSalary && job.salary && job.salary > 0 && job.salary < parseFloat(appliedMinSalary)) return false;
    
    if (appliedContractType && job.contract_type && job.contract_type !== appliedContractType) return false;
    if (appliedContractTime && job.contract_time && job.contract_time !== appliedContractTime) return false;
    
    // Only filter by location if the job actually has location metadata
    if (appliedCity && job.location_name && !job.location_name.toLowerCase().includes(appliedCity.toLowerCase())) return false;
    if (appliedCountry && job.location_name && !job.location_name.toLowerCase().includes(appliedCountry.toLowerCase())) return false;
    
    return true;
  });

  const handleApplyFilters = () => {
    setAppliedMinSalary(minSalary);
    setAppliedContractType(contractType);
    setAppliedContractTime(contractTime);
    setAppliedCity(city);
    setAppliedCountry(country);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setError('');

    try {
      // Save profile to Supabase
      const { error: saveError } = await supabase
        .from('users')
        .update({
          headline,
          summary,
          skills,
          work_experience: workExperience,
          education: education,
          projects: projects,
          certifications: certifications,
          city,
          country
        })
        .eq('id', userId);

      if (saveError) throw saveError;

      // Fetch recommendations
      const response = await fetch(`${API_BASE_URL}/recommend/${userId}`);
      const payload = await response.json();

      if (!response.ok || (payload && payload.error)) {
        throw new Error(payload.error || 'Recommendation request failed.');
      }

      const matches = Array.isArray(payload) ? payload : payload.matches || [];
      setJobMatches(matches);
      
      // Initialize applied filters with current values
      handleApplyFilters();
      
      setSubmitted(true);
    } catch (err) {
      console.error("Recommendation Error:", err);
      if (err.message.includes('Failed to fetch')) {
        setError('Connection failed: Make sure the recommendation server is running on port 8000.');
      } else {
        setError(err.message || 'Failed to get recommendations. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-in">
      <div className="jobs-header">
        <div className="jobs-header-inner">
          <h1 className="jobs-h1">Get Job Recommendations</h1>
          <p className="jobs-subtitle">Fill in your profile details to receive personalized job matches.</p>
        </div>
      </div>

      <div className="jobs-body">
        {!userId ? (
          <div className="page-in" style={{ textAlign: 'center', padding: '80px 20px' }}>
            <h2>Please log in to access job recommendations.</h2>
            <button className="btn-primary" onClick={() => navigate('login')}>Login</button>
          </div>
        ) : !submitted ? (
          <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="auth-field">
              <label>Professional Headline</label>
              <input
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder="e.g. AI Engineer with 3 years experience"
                required
              />
            </div>
            <div className="auth-field">
              <label>Skills (Optional)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {skills.map(skill => (
                  <button key={skill} type="button" className="filter-chip" style={{ background: T.indigoPale }} onClick={() => removeSkill(skill)}>{skill} ×</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  style={{ flex: 1 }}
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                  placeholder="Add a skill (e.g. Python, React)"
                />
                <button className="btn-secondary" type="button" onClick={addSkill}>Add</button>
              </div>
            </div>

            <DynamicList
              title="Work Experience (Optional)" icon={Briefcase}
              items={workExperience}
              setter={setWorkExperience}
              emptyFn={emptyExp}
              renderItem={(item, i, update) => (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 4 }}>Company</label>
                      <input className="dash-input" value={item.company} onChange={e => update('company', e.target.value)} placeholder="e.g. Google" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 4 }}>Position</label>
                      <input className="dash-input" value={item.position} onChange={e => update('position', e.target.value)} placeholder="e.g. Software Engineer" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 4 }}>Start Date</label>
                      <input className="dash-input" value={item.start_date} onChange={e => update('start_date', e.target.value)} placeholder="Jan 2020" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 4 }}>End Date</label>
                      <input className="dash-input" value={item.end_date} onChange={e => update('end_date', e.target.value)} placeholder="Present" />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 4 }}>Description</label>
                    <textarea 
                      className="dash-input" 
                      value={item.description} 
                      onChange={e => update('description', e.target.value)} 
                      placeholder="- Built features..."
                      rows={2}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </>
              )}
            />

            <DynamicList
              title="Education (Optional)" icon={GraduationCap}
              items={education}
              setter={setEducation}
              emptyFn={emptyEdu}
              renderItem={(item, i, update) => (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 4 }}>Institution</label>
                      <input className="dash-input" value={item.institution} onChange={e => update('institution', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 4 }}>Degree</label>
                      <input className="dash-input" value={item.degree} onChange={e => update('degree', e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div style={{ gridColumn: 'span 1' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 4 }}>Field</label>
                      <input className="dash-input" value={item.field_of_study} onChange={e => update('field_of_study', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 4 }}>Start</label>
                      <input className="dash-input" value={item.start_date} onChange={e => update('start_date', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 4 }}>End</label>
                      <input className="dash-input" value={item.end_date} onChange={e => update('end_date', e.target.value)} />
                    </div>
                  </div>
                </>
              )}
            />

            <DynamicList
              title="Projects (Optional)" icon={Globe}
              items={projects}
              setter={setProjects}
              emptyFn={emptyProj}
              renderItem={(item, i, update) => (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 4 }}>Name</label>
                      <input className="dash-input" value={item.name} onChange={e => update('name', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 4 }}>URL</label>
                      <input className="dash-input" value={item.url} onChange={e => update('url', e.target.value)} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 4 }}>Technologies</label>
                    <input className="dash-input" value={item.technologies} onChange={e => update('technologies', e.target.value)} placeholder="e.g. React, Node.js" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 4 }}>Description</label>
                    <textarea 
                      className="dash-input" 
                      value={item.description} 
                      onChange={e => update('description', e.target.value)} 
                      rows={2}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </>
              )}
            />

            <div className="auth-field">
              <label>Certifications (Optional)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {certifications.map(cert => (
                  <button key={cert} type="button" className="filter-chip" style={{ background: T.indigoPale }} onClick={() => removeCert(cert)}>{cert} ×</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  style={{ flex: 1 }}
                  value={certInput}
                  onChange={e => setCertInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }}
                  placeholder="Add a certification (e.g. AWS Certified, PMP)"
                />
                <button className="btn-secondary" type="button" onClick={addCert}>Add</button>
              </div>
            </div>
            <div className="auth-actions">
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Getting recommendations…' : 'Get Job Recommendations'}
              </button>
            </div>
            {error && <div className="auth-error">{error}</div>}
          </form>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2>Your Job Recommendations</h2>
              <button className="btn-secondary" onClick={() => setSubmitted(false)}>Edit Profile</button>
            </div>
            {/* Filters */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16, fontFamily: T.font, fontWeight: 600 }}>Filter Results</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 6 }}>Min Salary ($)</label>
                  <input
                    type="number"
                    value={minSalary}
                    onChange={e => setMinSalary(e.target.value)}
                    placeholder="e.g. 50000"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg, fontSize: 14, color: '#8B5CF6' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 6 }}>Contract Type</label>
                  <select
                    value={contractType}
                    onChange={e => setContractType(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg, fontSize: 14, color: '#8B5CF6' }}
                  >
                    <option value="">All</option>
                    <option value="permanent">Permanent</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 6 }}>Contract Time</label>
                  <select
                    value={contractTime}
                    onChange={e => setContractTime(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg, fontSize: 14, color: '#8B5CF6' }}
                  >
                    <option value="">All</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 6 }}>City</label>
                  <input
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. London"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg, fontSize: 14, color: '#8B5CF6' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 6 }}>Country</label>
                  <input
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="e.g. UK"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg, fontSize: 14, color: '#8B5CF6' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button 
                    className="btn-primary" 
                    onClick={handleApplyFilters}
                    style={{ height: 40, width: '100%', fontSize: 13, borderRadius: 10 }}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
            {filteredJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: T.textMuted }}>
                <h3>No recommendations found</h3>
                <p>Try updating your profile or adjusting filters for better matches.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredJobs.map((job, idx) => {
                  const match = job.match ?? Math.round((job.score ?? 0) * 100);
                  const badge = match >= 85 ? { cls: 'match-badge-high', lbl: `${match}% match` } : match >= 65 ? { cls: 'match-badge-mid', lbl: `${match}% match` } : { cls: 'match-badge-low', lbl: `${match}% match` };
                  const salaryLabel = (job.salary && job.salary !== 0 && job.salary !== '0') 
                    ? (typeof job.salary === 'number' ? `Salary:$${Math.round(job.salary)}` : `Salary:${job.salary}`) 
                    : 'Salary:N/A';

                  return (
                    <div key={job.id} className="job-card" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                        <div className="job-logo">{(job.company || 'Nexus').slice(0, 2).toUpperCase()}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 16, color: T.text, letterSpacing: '-0.02em', marginBottom: 3 }}>{job.title}</div>
                          <div style={{ fontSize: 13, color: T.textSecondary }}>{job.company}</div>
                        </div>
                        <span className={badge.cls}>{badge.lbl}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {job.contract_type && <span className="meta-chip">{job.contract_type}</span>}
                        {job.contract_time && <span className="meta-chip">{job.contract_time}</span>}
                      </div>
                      {Array.isArray(job.skills) && job.skills.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
                          {job.skills.map(s => <span key={s} className="skill-chip">{s}</span>)}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 14, color: T.text }}>{salaryLabel}</div>
                        </div>
                        <button className="apply-btn" onClick={() => { if (job.redirect_url) window.open(job.redirect_url, '_blank'); }}>
                          Apply now
                        </button>
                      </div>
                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                        <button 
                          className="btn-secondary" 
                          style={{ width: '100%', justifyContent: 'center', fontSize: 13, padding: '10px' }}
                          onClick={async () => {
                            if (expandedRoadmap === job.id) {
                              setExpandedRoadmap(null);
                              return;
                            }
                            setExpandedRoadmap(job.id);
                            if (!roadmaps[job.id]) {
                              setLoadingRoadmap(job.id);
                              try {
                                // 1. Fetch user data
                                const { data: userData } = await supabase.from('users').select('*').eq('id', userId).single();
                                
                                // 2. Try to scrape the actual JD from the URL
                                let jobDescription = `TITLE: ${job.title}\nCOMPANY: ${job.company}\n`;
                                if (job.redirect_url) {
                                  try {
                                    const scrapeRes = await fetch(`${API_BASE_URL}/scrape-jd?url=${encodeURIComponent(job.redirect_url)}`);
                                    const scrapeData = await scrapeRes.json();
                                    if (scrapeData.description) {
                                      jobDescription += `\nFULL DESCRIPTION:\n${scrapeData.description}`;
                                    }
                                  } catch (e) {
                                    console.warn("Scraping failed, using available metadata:", e);
                                  }
                                }

                                // 3. Get Groq roadmap with the combined data
                                const res = await getSkillRoadmapWithGroq(userData, jobDescription);
                                setRoadmaps(prev => ({ ...prev, [job.id]: res }));
                              } catch (err) {
                                console.error("Roadmap error:", err);
                              } finally {
                                setLoadingRoadmap(null);
                              }
                            }
                          }}
                        >
                          <Icon.Bolt size={14} /> Recommended Skills
                        </button>
                        
                        {expandedRoadmap === job.id && (
                          <div style={{ 
                            marginTop: 12, padding: 16, background: T.indigoPale, borderRadius: 12, 
                            border: `1px solid #C7D7FD`, animation: 'fadeUp 0.3s ease' 
                          }}>
                            <h4 style={{ fontSize: 14, fontWeight: 800, color: T.indigo, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Icon.Brain size={16} /> Personalized Roadmap
                            </h4>
                            {loadingRoadmap === job.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.textSecondary, fontSize: 13 }}>
                                <span className="cp-spinner" style={{ position: 'static', width: 14, height: 14, borderColor: `${T.indigo}44`, borderTopColor: T.indigo }} />
                                Generating roadmap...
                              </div>
                            ) : (
                              <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                {roadmaps[job.id].split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g).map((part, i) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={i} style={{ color: T.text }}>{part.slice(2, -2)}</strong>;
                                  }
                                  if (part.startsWith('[') && part.includes('](')) {
                                    const m = part.match(/\[(.*?)\]\((.*?)\)/);
                                    if (m) {
                                      return <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer" style={{ color: T.indigo, fontWeight: 600, textDecoration: 'underline' }}>{m[1]}</a>;
                                    }
                                  }
                                  return part;
                                })}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────────
const MOCK = {
  match: 78,
  jobs: [
    { id: 1, title: "Senior Frontend Engineer", company: "Stripe",  salary: "$140k–$180k", tags: ["React", "TypeScript", "GraphQL"],     hot: true,  fit: 92 },
    { id: 2, title: "Full-Stack Developer",      company: "Notion",  salary: "$120k–$155k", tags: ["Node.js", "React", "PostgreSQL"],     hot: true,  fit: 85 },
    { id: 3, title: "UI/UX Engineer",            company: "Figma",   salary: "$130k–$170k", tags: ["Design Systems", "React", "CSS"],     hot: false, fit: 79 },
    { id: 4, title: "Software Engineer II",      company: "Linear",  salary: "$115k–$145k", tags: ["TypeScript", "WebSockets", "Redux"],  hot: false, fit: 71 },
  ],
  gaps: ["TypeScript", "System Design", "Docker", "GraphQL", "Jest / Cypress"],
};

const LOAD_STEPS = [
  "Analyzing your skills...",
  "Matching job opportunities...",
  "Scoring compatibility...",
  "Finalizing your report...",
];

function TagInput({ tags, setTags, input, setInput }) {
  const addSkill = () => {
    const next = input.trim();
    if (!next) return;
    if (!tags.includes(next)) setTags([...tags, next]);
    setInput("");
  };
  const handleKey = e => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(); return; }
    if (e.key === "Backspace" && !input && tags.length) setTags(tags.slice(0, -1));
  };
  return (
    <div className="tag-box">
      {tags.map(t => (
        <span key={t} className="skill-tag">
          {t}
          <button className="skill-tag-x" onClick={() => setTags(tags.filter(x => x !== t))}>×</button>
        </span>
      ))}
      <input
        className="tag-inner-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={addSkill}
        placeholder={tags.length === 0 ? "Type a skill, press Enter…" : ""}
      />
    </div>
  );
}

function CircleMatch({ pct }) {
  const r    = 52;
  const circ = 2 * Math.PI * r;
  const [prog, setProg] = useState(0);
  useEffect(() => { const t = setTimeout(() => setProg(pct), 300); return () => clearTimeout(t); }, [pct]);
  const color = prog >= 75 ? T.teal : prog >= 50 ? T.amber : "#DC2626";
  return (
    <div style={{ position: "relative", flexShrink: 0, width: 136, height: 136 }}>
      <svg width="136" height="136" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="68" cy="68" r={r} fill="none" stroke={T.border} strokeWidth="10" />
        <circle cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={circ - (prog / 100) * circ}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.22,.68,0,1.2)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: T.font, fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em", color }}>{prog}%</span>
        <span style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".08em", marginTop: 2, fontWeight: 600 }}>Overall match</span>
      </div>
    </div>
  );
}

// ── Contact Page ──────────────────────────────────────────────────────────────────
function ContactPage() {
  const [form, setForm]     = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Name is required";
    if (!form.email.trim())   e.email   = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.message.trim()) e.message = "Message is required";
    return e;
  };

  const onChange  = e => { const { name, value } = e.target; setForm(p => ({ ...p, [name]: value })); if (errors[name]) setErrors(p => ({ ...p, [name]: "" })); };
  const onSubmit  = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    const userId = localStorage.getItem('nexus_user_id');
    if (!userId) {
      setErrors({ name: "Please log in to send a message." });
      return;
    }

    setStatus("loading");
    
    try {
      const { error: saveError } = await supabase
        .from('users')
        .update({
          full_name: form.name,
          email: form.email,
          message: form.message
        })
        .eq('id', userId);

      if (saveError) throw saveError;

      setStatus("success");
      setTimeout(() => { 
        setStatus("idle"); 
        setForm({ name: "", email: "", message: "" }); 
      }, 3500);
    } catch (err) {
      console.error("Contact form error:", err);
      setErrors({ message: "Failed to send message. Please try again." });
      setStatus("idle");
    }
  };

  const infoItems = [
    { icon: <Icon.Email />,    label: "Email",   value: "hello@nexuscareers.io" },
    { icon: <Icon.Phone />,    label: "Phone",   value: "+1 (555) 000-1234" },
    { icon: <Icon.Location />, label: "Office",  value: "340 Pine St, SF, CA" },
    { icon: <Icon.Clock />,    label: "Hours",   value: "Mon–Fri, 9am–6pm" },
  ];

  return (
    <div className="page-in contact-page">
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 24px 80px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }} className="fadeup-1">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: T.indigo, marginBottom: 18 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.indigo, display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
            Get in touch
          </div>
          <h1 style={{ fontFamily: T.font, fontSize: "clamp(2.2rem,5vw,3.6rem)", fontWeight: 800, lineHeight: 1.07, letterSpacing: "-0.035em", color: T.text, marginBottom: 14 }}>
            Let's build something<br /><span className="grad-text">remarkable together</span>
          </h1>
          <p style={{ fontSize: 15, color: T.textSecondary, maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
            Have a question, idea or project in mind? Drop us a message and we'll get back to you promptly.
          </p>
        </div>

        <div className="cp-card fadeup-2">
          <div className="cp-top-line" />
          <form onSubmit={onSubmit} noValidate>
            {[["Full name", "name", "text", "Alex Johnson"], ["Email address", "email", "email", "alex@company.com"]].map(([lbl, name, type, ph]) => (
              <div style={{ marginBottom: 20 }} key={name}>
                <label className="cp-label">{lbl}</label>
                <input name={name} type={type} className="cp-input" placeholder={ph} value={form[name]} onChange={onChange} disabled={status === "loading"} autoComplete="off" />
                {errors[name] && <p className="cp-err">{errors[name]}</p>}
              </div>
            ))}
            <div style={{ marginBottom: 24 }}>
              <label className="cp-label">Message</label>
              <textarea name="message" className="cp-input" placeholder="Tell us about your project or question…" value={form.message} onChange={onChange} disabled={status === "loading"} style={{ height: 130, resize: "none", lineHeight: 1.65 }} />
              {errors.message && <p className="cp-err">{errors.message}</p>}
            </div>
            <button type="submit" className={`cp-btn${status === "success" ? " success" : ""}`} disabled={status === "loading" || status === "success"}>
              {status === "idle"    && "Send message"}
              {status === "loading" && <span className="cp-spinner" />}
              {status === "success" && <span className="cp-success-wrap"><Icon.Check /> Message sent</span>}
            </button>
          </form>

          <div style={{ borderTop: `1px solid ${T.border}`, margin: "32px 0" }} />

          <div className="info-grid">
            {infoItems.map(({ icon, label, value }) => (
              <div key={label} className="info-item">
                <div className="info-icon">{icon}</div>
                <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: T.textMuted, marginBottom: 0 }}>{label}</p>
                <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.4, fontWeight: 500 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Chatbot (with bot logo image) ─────────────────────────────────────────────────
function FAQChatbot() {
  const [isOpen, setIsOpen]     = useState(false);
  const [messages, setMessages] = useState([{ role: "model", text: "Hi! I'm the Nexus Careers assistant. How can I help you today?" }]);
  const [input, setInput]       = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef          = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg    = { role: "user", text: input.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setIsTyping(true);
    try {
      const responseText = await askChatbotWithGroq({ history: newHistory });
      setMessages([...newHistory, { role: "model", text: responseText }]);
    } catch {
      setMessages([...newHistory, { role: "model", text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally { setIsTyping(false); }
  };

  const botImgSrc = botLogo;

  return (
    <div className="chatbot-widget">
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            {/* Bot logo in chat header */}
            <div className="chat-header-logo">
              <img src={botImgSrc} alt="Nexus AI" />
            </div>
            <div style={{ flex: 1 }}>Nexus Assistant</div>
            <button className="chat-close" onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="chat-messages">
            {messages.map((msg, i) => <div key={i} className={`chat-msg ${msg.role}`}>{msg.text}</div>)}
            {isTyping && (
              <div className="chat-msg model">
                <div className="typing-indicator">
                  <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-area">
            <input type="text" className="chat-input" placeholder="Ask me anything..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSend(); }} disabled={isTyping} />
            <button className="chat-send" onClick={handleSend} disabled={!input.trim() || isTyping}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
      {/* FAB uses the bot logo with mix-blend-mode:screen to drop the black */}
      <button className="chatbot-fab" onClick={() => setIsOpen(!isOpen)} title="Chat with Nexus AI">
        <img src={botImgSrc} alt="Nexus AI Assistant" />
      </button>
    </div>
  );
}

// ── Generic Information Page (Privacy, Terms, About, etc.) ───────────────────────
function GenericInfoPage({ type, navigate }) {
  const content = {
    privacy: {
      title: "Privacy Policy",
      subtitle: "How we look after your information",
      text: "We know that giving us your career history is a big deal and we take that responsibility seriously. We use Supabase to keep your profile secure and Pinecone to help find job matches that actually fit you. Your data belongs to you and we do not sell your information to other companies. We also do not use your personal details to train any AI systems. If you use our tool to polish your resume we use a private connection that does not keep a record of your data. You are in control of your account so if you ever want to delete your data we make it simple for you to do that whenever you want."
    },
    terms: {
      title: "Terms of Service",
      subtitle: "How things work around here",
      text: "We are here to help you find a job and we just ask that you stay honest with us in return. When you make your profile please keep the information accurate because it helps our system give you better matches. Our AI tools and job suggestions are built to give you a head start but you should always check everything yourself before you send an application. We want to keep this platform fair for everyone so please do not try to use bots or scrape the site. We will keep updating the features to make sure you have the best tools for your search."
    },
    about: {
      title: "About Nexus",
      subtitle: "A bit about our story",
      text: "We started Nexus because the usual job hunt is often frustrating. It can feel like your resume is lost in a pile of keywords and filters that do not really show who you are. We wanted to build something that understands the actual meaning of your skills and not just the words on the page. By using technology that can read into your experience we want to match you with roles that you will enjoy going to every day. We are just a group of people who want to make finding work a better experience for everyone and we are glad you are here."
    },
    security: {
      title: "Security & Safety",
      subtitle: "Keeping your account protected",
      text: "Keeping your account safe is very important to us. We built this site with different levels of protection from the login screen to the way your data is stored so only you can see it. We use encryption for everything and our servers are set up to stop any outside access. We check our systems regularly to stay ahead of any problems because we want you to focus on your career and not have to worry about your data being safe. Your information is secure here and we work hard to keep it that way."
    },
    cookies: {
        title: "Cookie Policy",
        subtitle: "How we use cookies on the site",
        text: "We use a few small files called cookies and local storage to make sure the site works well for you. They mostly help us keep you logged in as you move from the resume builder to the jobs page so you do not have to type your password every single time. They also help the site remember your filter choices so everything stays the way you left it. We do not use these to track you on other websites or show you ads. We only use them to make sure the site is fast and easy to use whenever you visit."
    }
  };

  const p = content[type] || content.privacy;

  return (
    <div className="page-in animate-fade-in" style={{ padding: "80px 24px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ textAlign: "center", marginBottom: 60, maxWidth: 900 }}>
        <div className="section-label" style={{ marginBottom: 16 }}>Nexus {titleCase(type)}</div>
        <h1 style={{ fontFamily: T.font, fontSize: "clamp(2.5rem,6vw,4rem)", fontWeight: 800, color: T.text, letterSpacing: "-0.04em", marginBottom: 20 }}>
          {p.title}
        </h1>
        <p style={{ fontSize: 18, color: T.textSecondary, fontWeight: 500 }}>{p.subtitle}</p>
      </div>
      
      <div className="cp-card" style={{ padding: "60px 40px", lineHeight: 2, fontSize: 17, color: T.textSecondary, textAlign: 'center', margin: "0 auto", maxWidth: 900 }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
            {p.text}
        </div>
        <div style={{ marginTop: 50, paddingTop: 40, borderTop: `1px solid ${T.border}` }}>
            <button className="btn-primary" onClick={() => navigate('home')}>Back to Home</button>
        </div>
      </div>
    </div>
  );
}

function titleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
export default function App() {
  const [page, setPage] = useState("home");
  const [infoType, setInfoType] = useState("privacy");
  const [userId, setUserId] = useState(localStorage.getItem('nexus_user_id'));
  const [showAuthModal, setShowAuthModal] = useState(false);

  const navigate = p => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (p === 'jobs' && !userId) {
      setShowAuthModal(true);
      return;
    }
    if (p === 'login') {
      setShowAuthModal(true);
      return;
    }
    if (['privacy', 'terms', 'about', 'security', 'cookies', 'blog'].includes(p)) {
      setPage('info');
      setInfoType(p);
      return;
    }
    setPage(p);
  };

  useEffect(() => {
    if (!userId) {
      setShowAuthModal(true);
    }
  }, [userId]);

  const handleLogin = async ({ email, password }) => {
    const password_hash = await hashPassword(password);
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id,password_hash')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      throw new Error('Unable to verify your account.');
    }
    if (!existing) {
      throw new Error('No account found for that email.');
    }
    if (existing.password_hash === 'temp') {
      throw new Error('This email was created with a temporary account. Please sign up to activate it.');
    }
    if (existing.password_hash !== password_hash) {
      throw new Error('Invalid password.');
    }

    localStorage.setItem('nexus_user_id', existing.id);
    setUserId(existing.id);
    setShowAuthModal(false);
    setPage('jobs');
  };

  const handleSignup = async ({ email, password, full_name }) => {
    const password_hash = await hashPassword(password);
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id,password_hash')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      throw new Error('Unable to create your account.');
    }

    let userIdToStore = null;

    if (existing) {
      if (existing.password_hash !== 'temp') {
        throw new Error('An account already exists with that email. Please log in.');
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash, full_name })
        .eq('id', existing.id);

      if (updateError) {
        throw new Error('Unable to update your existing account.');
      }
      userIdToStore = existing.id;
    } else {
      const { data, error } = await supabase
        .from('users')
        .insert({ email, full_name, password_hash, headline: '', summary: '', skills: [] })
        .select('id')
        .maybeSingle();

      if (error || !data?.id) {
        throw new Error('Unable to create your account.');
      }
      userIdToStore = data.id;
    }

    localStorage.setItem('nexus_user_id', userIdToStore);
    setUserId(userIdToStore);
    setShowAuthModal(false);
    setPage('jobs');
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_user_id');
    setUserId(null);
    setPage('home');
    setShowAuthModal(true);
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text }}>
      <style>{CSS}</style>
      <Nav page={page} navigate={navigate} userId={userId} onLogout={handleLogout} onShowAuth={() => setShowAuthModal(true)} />

      {page === "home"      && <LandingPage navigate={navigate} userId={userId} />}
      {page === "jobs"      && <JobsPage userId={userId} navigate={navigate} />}
      {page === "resume"    && (
        <div className="resume-page-host">
          <ResumePage />
        </div>
      )}
      {page === "contact"   && <ContactPage />}
      {page === "info"      && <GenericInfoPage type={infoType} navigate={navigate} />}

      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-content" onClick={e => e.stopPropagation()}>
            <LoginPage onLogin={handleLogin} onSignup={handleSignup} navigate={navigate} userId={userId} onClose={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}

      <FAQChatbot />
    </div>
  );
}