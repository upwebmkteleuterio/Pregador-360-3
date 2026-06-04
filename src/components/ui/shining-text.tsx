"use client";

import React from "react";
import { motion } from "motion/react";

interface ShiningTextProps {
  text: string;
}

export function ShiningText({ text }: ShiningTextProps) {
  return (
    <motion.div
      className="bg-[linear-gradient(110deg,#a1a1aa,35%,#eab308,50%,#a1a1aa,65%,#a1a1aa)] bg-[length:200%_100%] bg-clip-text text-center text-xs font-medium tracking-wide text-transparent py-2"
      initial={{ backgroundPosition: "200% 0" }}
      animate={{ backgroundPosition: "-200% 0" }}
      transition={{
        repeat: Infinity,
        duration: 2.5,
        ease: "linear",
      }}
    >
      {text}
    </motion.div>
  );
}