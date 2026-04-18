export type Course = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  createdAt?: string;
};

export type PurchaseRow = {
  purchaseId: string;
  purchasedAt: string;
  course: Course;
};

export type User = {
  id: string;
  email: string;
  name: string;
};
