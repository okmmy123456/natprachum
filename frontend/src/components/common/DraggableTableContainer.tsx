'use client';

import React, { useRef, useState, useCallback } from 'react';
import { TableContainer } from '@mui/material';

export default function DraggableTableContainer({ sx, children, ...props }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasMoved = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only primary (left) click
    if (e.button !== 0) return;

    // Check if clicking inside interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest(
        "button, input, select, a, textarea, [role='button'], .MuiIconButton-root, .MuiChip-root, .MuiSwitch-root, .MuiCheckbox-root, .MuiRadio-root, .MuiSelect-select"
      )
    ) {
      return;
    }

    if (!containerRef.current) return;
    setIsPanning(true);
    hasMoved.current = false;
    startX.current = e.clientX;
    scrollLeft.current = containerRef.current.scrollLeft;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPanning || !containerRef.current) return;
      const dx = e.clientX - startX.current;
      if (Math.abs(dx) > 3) {
        hasMoved.current = true;
      }
      containerRef.current.scrollLeft = scrollLeft.current - dx;
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  return (
    <TableContainer
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      title="🖱️ คลิกเมาส์ค้างแล้วลากซ้าย-ขวาเพื่อเลื่อนดูตาราง"
      sx={{
        overflowX: 'auto',
        cursor: isPanning ? 'grabbing !important' : 'grab',
        userSelect: isPanning ? 'none' : 'auto',
        WebkitOverflowScrolling: 'touch',
        ...sx,
      }}
      {...props}
    >
      {children}
    </TableContainer>
  );
}
