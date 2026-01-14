/**
 * Vector Database Abstraction Layer
 * Provides a unified interface for vector operations using Pinecone
 * Supports multiple namespaces for different data types
 */

import { Pinecone } from '@pinecone-database/pinecone';

// Singleton Pinecone client
let pineconeClient: Pinecone | null = null;
let pineconeIndex: any = null;

export type VectorNamespace = 'knowledge' | 'conversations' | 'user_content';

interface VectorMetadata {
    title?: string;
    content: string;
    userId?: string;
    createdAt: string;
    [key: string]: any;
}

interface VectorRecord {
    id: string;
    values: number[];
    metadata: VectorMetadata;
}

interface QueryResult {
    id: string;
    score: number;
    metadata: VectorMetadata;
}

/**
 * Initialize Pinecone client (called once)
 */
export async function initVectorDB() {
    if (pineconeClient && pineconeIndex) {
        return { client: pineconeClient, index: pineconeIndex };
    }

    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME || 'famio-ai';

    if (!apiKey) {
        throw new Error('PINECONE_API_KEY is not set in environment variables');
    }

    try {
        console.log('🔌 Initializing Pinecone client...');
        pineconeClient = new Pinecone({
            apiKey: apiKey,
        });

        // Get or create index
        pineconeIndex = pineconeClient.index(indexName);

        console.log('✅ Pinecone initialized successfully');
        return { client: pineconeClient, index: pineconeIndex };
    } catch (error) {
        console.error('❌ Failed to initialize Pinecone:', error);
        throw error;
    }
}

/**
 * Upsert vectors to a specific namespace
 */
export async function upsertVectors(
    namespace: VectorNamespace,
    vectors: VectorRecord[]
): Promise<void> {
    try {
        const { index } = await initVectorDB();

        console.log(`📤 Upserting ${vectors.length} vectors to namespace: ${namespace}`);

        await index.namespace(namespace).upsert(vectors);

        console.log('✅ Vectors upserted successfully');
    } catch (error) {
        console.error('❌ Error upserting vectors:', error);
        throw error;
    }
}

/**
 * Query vectors for similarity search
 */
export async function queryVectors(
    namespace: VectorNamespace,
    queryVector: number[],
    topK: number = 5,
    filter?: Record<string, any>,
    minScore: number = 0.7
): Promise<QueryResult[]> {
    try {
        const { index } = await initVectorDB();

        console.log(`🔍 Querying ${topK} vectors from namespace: ${namespace}`);

        const queryResponse = await index.namespace(namespace).query({
            vector: queryVector,
            topK,
            includeMetadata: true,
            filter,
        });

        // Filter by minimum score and map to simplified format
        const results: QueryResult[] = queryResponse.matches
            .filter((match: any) => match.score >= minScore)
            .map((match: any) => ({
                id: match.id,
                score: match.score,
                metadata: match.metadata as VectorMetadata,
            }));

        console.log(`✅ Found ${results.length} results above score ${minScore}`);
        return results;
    } catch (error) {
        console.error('❌ Error querying vectors:', error);
        throw error;
    }
}

/**
 * Delete vectors from a namespace (for cleanup or GDPR)
 */
export async function deleteVectors(
    namespace: VectorNamespace,
    ids: string[]
): Promise<void> {
    try {
        const { index } = await initVectorDB();

        console.log(`🗑️ Deleting ${ids.length} vectors from namespace: ${namespace}`);

        await index.namespace(namespace).deleteMany(ids);

        console.log('✅ Vectors deleted successfully');
    } catch (error) {
        console.error('❌ Error deleting vectors:', error);
        throw error;
    }
}

/**
 * Delete all vectors in a namespace (for user data cleanup)
 */
export async function deleteNamespace(
    namespace: VectorNamespace,
    filter?: Record<string, any>
): Promise<void> {
    try {
        const { index } = await initVectorDB();

        console.log(`🗑️ Deleting all vectors from namespace: ${namespace}`);

        if (filter) {
            await index.namespace(namespace).deleteMany(filter);
        } else {
            await index.namespace(namespace).deleteAll();
        }

        console.log('✅ Namespace cleaned successfully');
    } catch (error) {
        console.error('❌ Error deleting namespace:', error);
        throw error;
    }
}

/**
 * Get index stats
 */
export async function getVectorStats(): Promise<any> {
    try {
        const { index } = await initVectorDB();
        const stats = await index.describeIndexStats();
        return stats;
    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        throw error;
    }
}
