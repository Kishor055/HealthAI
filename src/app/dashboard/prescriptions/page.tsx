"use client";

import { UploadPrescription } from "@/components/prescriptions/upload-prescription";
import { motion } from "framer-motion";

export default function PrescriptionsPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-4 sm:p-6"
    >
       <UploadPrescription />
    </motion.div>
  );
}