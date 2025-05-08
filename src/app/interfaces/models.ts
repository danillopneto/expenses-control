// Expense interface represents a single expense record
export interface Expense {
  id?: string;
  date: string | { seconds: number } | Date;
  description: string;
  value: number;
  installments: number;
  place: string;
  category: string;      // category id
  accountUsed: string;   // account id
  [key: string]: any;    // for any extra fields
}

// Category interface represents a category for expenses
export interface Category {
  id?: string;
  name: string;
}

// Account interface represents an account used for expenses
export interface Account {
  id?: string;
  name: string;
}
