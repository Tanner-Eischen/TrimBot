export declare const projectToasts: {
  createFailed: (error: string) => string;
  [key: string]: any;
};

export declare const importToasts: {
  converting: (filename: string) => string;
  conversionComplete: (filename: string) => string;
  conversionFailed: (filename: string, error: string) => string;
  [key: string]: any;
};

export declare const editingToasts: {
  trimming: (filename: string) => string;
  trimComplete: (filename: string) => string;
  trimFailed: (filename: string, error: string) => string;
  [key: string]: any;
};