import { ChromaClient, Collection } from 'chromadb';
import { OpenAI } from 'openai';
import { Interpretation } from '../../models';
import dotenv from 'dotenv';

dotenv.config();

interface InterpretationMetadata {
  cardId: string;
  orientation: string;
  context: string;
  keywords: string[];
  qualityScore: number;
  mzStyle: boolean;
  combinationIds?: string[];
}

interface SearchResult {
  id: string;
  interpretation: string;
  metadata: InterpretationMetadata;
  similarity: number;
}

class VectorStoreService {
  private chromaClient: ChromaClient;
  private openaiClient: OpenAI;
  private collection: Collection | null = null;
  private collectionName: string;

  constructor() {
    const chromaHost = process.env.CHROMA_HOST || 'localhost';
    const chromaPort = process.env.CHROMA_PORT || '8000';

    this.chromaClient = new ChromaClient({
      path: `http://${chromaHost}:${chromaPort}`
    });

    this.openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'sk-test-key'
    });

    this.collectionName = process.env.CHROMA_COLLECTION || 'tarot_interpretations';
  }

  /**
   * Initialize vector store collection
   */
  async initialize(): Promise<void> {
    try {
      // Try to get existing collection
      this.collection = await this.chromaClient.getOrCreateCollection({
        name: this.collectionName,
        metadata: {
          description: 'Tarot card interpretations with embeddings',
          created_at: new Date().toISOString()
        }
      });

      console.log(`✅ Vector store collection '${this.collectionName}' initialized`);
    } catch (error) {
      console.error('❌ Error initializing vector store:', error);
      throw error;
    }
  }

  /**
   * Create embedding for text using OpenAI
   */
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openaiClient.embeddings.create({
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw error;
    }
  }

  /**
   * Add interpretation to vector store
   */
  async addInterpretation(
    id: string,
    interpretation: string,
    metadata: InterpretationMetadata
  ): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      const embedding = await this.createEmbedding(interpretation);

      await this.collection!.add({
        ids: [id],
        embeddings: [embedding],
        documents: [interpretation],
        metadatas: [metadata as any]
      });
    } catch (error) {
      console.error(`Error adding interpretation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add multiple interpretations in batch
   */
  async addInterpretations(
    interpretations: Array<{
      id: string;
      text: string;
      metadata: InterpretationMetadata;
    }>
  ): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }

    const BATCH_SIZE = 100;
    const batches = [];

    for (let i = 0; i < interpretations.length; i += BATCH_SIZE) {
      batches.push(interpretations.slice(i, i + BATCH_SIZE));
    }

    console.log(`Processing ${interpretations.length} interpretations in ${batches.length} batches...`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      try {
        // Create embeddings for batch
        const embeddings = await Promise.all(
          batch.map(item => this.createEmbedding(item.text))
        );

        // Add to collection
        await this.collection!.add({
          ids: batch.map(item => item.id),
          embeddings: embeddings,
          documents: batch.map(item => item.text),
          metadatas: batch.map(item => item.metadata as any)
        });

        console.log(`✅ Batch ${i + 1}/${batches.length} processed (${batch.length} items)`);
      } catch (error) {
        console.error(`❌ Error processing batch ${i + 1}:`, error);
        throw error;
      }
    }

    console.log('✅ All interpretations added to vector store');
  }

  /**
   * Search for similar interpretations
   */
  async searchSimilar(
    query: string,
    limit: number = 5,
    filters?: Partial<InterpretationMetadata>
  ): Promise<SearchResult[]> {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      const queryEmbedding = await this.createEmbedding(query);

      const results = await this.collection!.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        where: filters as any
      });

      if (!results.ids[0] || results.ids[0].length === 0) {
        return [];
      }

      return results.ids[0].map((id, index) => ({
        id: id as string,
        interpretation: results.documents[0][index] as string,
        metadata: results.metadatas[0][index] as InterpretationMetadata,
        similarity: 1 - (results.distances?.[0]?.[index] || 0) // Convert distance to similarity
      }));
    } catch (error) {
      console.error('Error searching similar interpretations:', error);
      throw error;
    }
  }

  /**
   * Search by card and context
   */
  async searchByCard(
    cardId: string,
    orientation: string,
    context: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    return this.searchSimilar(
      `${context} tarot reading`,
      limit,
      {
        cardId,
        orientation,
        context
      }
    );
  }

  /**
   * Search by card combination
   */
  async searchByCombination(
    cardIds: string[],
    context: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    const query = `tarot card combination reading for ${context}`;

    return this.searchSimilar(query, limit, {
      context
    });
  }

  /**
   * Get collection stats
   */
  async getStats(): Promise<{
    totalInterpretations: number;
    collectionName: string;
  }> {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      const count = await this.collection!.count();

      return {
        totalInterpretations: count,
        collectionName: this.collectionName
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalInterpretations: 0,
        collectionName: this.collectionName
      };
    }
  }

  /**
   * Clear all data from collection
   */
  async clearCollection(): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      await this.chromaClient.deleteCollection({
        name: this.collectionName
      });

      console.log(`✅ Collection '${this.collectionName}' cleared`);

      // Recreate collection
      await this.initialize();
    } catch (error) {
      console.error('Error clearing collection:', error);
      throw error;
    }
  }

  /**
   * Load interpretations from MongoDB and create embeddings
   */
  async loadFromDatabase(): Promise<void> {
    console.log('🔄 Loading interpretations from MongoDB...');

    try {
      const interpretations = await Interpretation.find();

      if (interpretations.length === 0) {
        console.log('⚠️ No interpretations found in database');
        return;
      }

      console.log(`Found ${interpretations.length} interpretations`);

      const items = interpretations.map(interp => ({
        id: interp._id.toString(),
        text: interp.interpretation,
        metadata: {
          cardId: interp.cardId.toString(),
          orientation: interp.orientation,
          context: interp.context,
          keywords: interp.keywords,
          qualityScore: interp.qualityScore,
          mzStyle: interp.mzStyle,
          combinationIds: interp.combinationIds?.map(id => id.toString())
        }
      }));

      await this.addInterpretations(items);

      console.log('✅ All interpretations loaded to vector store');
    } catch (error) {
      console.error('❌ Error loading from database:', error);
      throw error;
    }
  }
}

// Singleton instance
const vectorStoreService = new VectorStoreService();

export default vectorStoreService;
export { VectorStoreService, SearchResult, InterpretationMetadata };
