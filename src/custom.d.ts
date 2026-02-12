declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface AutoTableOptions {
    startY?: number;
    head?: string[][];
    body?: (string | number)[][];
    theme?: 'striped' | 'grid' | 'plain';
    headStyles?: {
      fillColor?: number[];
      textColor?: number | number[];
      fontStyle?: string;
      halign?: 'left' | 'center' | 'right';
    };
    styles?: {
      fontSize?: number;
      cellPadding?: number;
    };
    columnStyles?: {
      [key: number]: {
        halign?: 'left' | 'center' | 'right';
        fontStyle?: string;
      };
    };
  }

  export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;

  declare module 'jspdf' {
    interface jsPDF {
      lastAutoTable: {
        finalY: number;
      };
    }
  }
}
