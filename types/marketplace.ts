export interface MarketplaceListing {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    category: 'vehicles' | 'property' | 'electronics' | 'clothing' | 'hobbies' | 'family';
    images: string[];
    sellerId: string;
    location?: {
        lat: number;
        lng: number;
        name: string;
    };
    createdAt: Date;
    status: 'active' | 'sold' | 'pending';
}

export type MarketplaceCategory = MarketplaceListing['category'];
