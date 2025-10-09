"use client"
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { UploadExcelModal } from "@/components/upload-excel-modal";
import { PlusCircle } from "lucide-react";

interface DataSourceMenuProps {
    onSuccess: (dataSourceId: string) => void;
}

export function DataSourceMenu({ onSuccess }: DataSourceMenuProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsModalOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Data Source
      </Button>
      <UploadExcelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onSuccess}
      />
    </div>
  );
}