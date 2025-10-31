export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  shortDescription: string;
  description: string;
  characteristics: Record<string, string>;
  features: string[];
}
