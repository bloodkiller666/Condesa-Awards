"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

// Registra plugins de forma global (solo una vez).
if (typeof window !== "undefined") {
  gsap.registerPlugin(
    ScrollTrigger,
    SplitText,
    ScrambleTextPlugin,
    CustomEase,
    useGSAP
  );
  // Curva de "redoble": arranca rápido y se frena de golpe antes del final.
  CustomEase.create("drumroll", "M0,0 C0.25,0.9 0.5,0.97 0.7,0.99 0.85,1 0.95,1 1,1");
}

export { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin, CustomEase, useGSAP };
