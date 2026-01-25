'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { getUserProfile } from "@/lib/auth";
import { MarketplaceListing } from "@/types/marketplace";

export async function createListing(data: Omit<MarketplaceListing, 'id' | 'sellerId' | 'createdAt' | 'status'>) {
    const user = await getUserProfile();
    if (!user) throw new Error("Unauthorized");

    const listingData = {
        ...data,
        sellerId: user.uid,
        sellerName: user.displayName || 'Unknown',
        sellerImage: user.photoURL,
        createdAt: new Date().toISOString(),
        status: 'active',
        likes: 0
    };

    const docRef = await addDoc(collection(db, "listings"), listingData);
    return { id: docRef.id, ...listingData };
}

export async function getListings(category?: string) {
    let q = query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(50));

    if (category && category !== 'all') {
        q = query(collection(db, "listings"), where("category", "==", category), orderBy("createdAt", "desc"), limit(50));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as any[];
}
