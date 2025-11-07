import vectorStoreService, { SearchResult } from './vectorStore';
import llmService from './llmService';
import { TarotCard, Interpretation } from '../../models';
import { PromptContext } from '../../utils/promptTemplates';
import dotenv from 'dotenv';

dotenv.config();

interface UserContext {
  question?: string;
  age?: number;
  gender?: string;
  previousReadings?: any[];
  concerns?: string[];
}

interface CardInfo {
  id: string;
  name: string;
  nameKo: string;
  orientation: 'upright' | 'reversed';
  position?: number;
  positionName?: string;
}

interface CombinationAnalysis {
  overallMessage: string;
  synergy: string[];
  keywords: string[];
  practicalAdvice: string[];
  energy: 'positive' | 'challenging' | 'balanced';
}

interface PersonalizedReading {
  interpretation: string;
  baseInterpretations: string[];
  keywords: string[];
  followUpQuestions?: string[];
  confidence: number; // 0-1
  sources: Array<{
    cardId: string;
    interpretationId: string;
    similarity: number;
  }>;
}

class RAGService {
  private topK: number;
  private similarityThreshold: number;
  private maxContextLength: number;

  constructor() {
    this.topK = parseInt(process.env.RAG_TOP_K || '5', 10);
    this.similarityThreshold = parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.7');
    this.maxContextLength = parseInt(process.env.RAG_MAX_CONTEXT_LENGTH || '2000', 10);
  }

  /**
   * Search for relevant interpretations using vector similarity
   */
  async searchInterpretations(
    cards: CardInfo[],
    context: string = 'general',
    limit: number = this.topK
  ): Promise<SearchResult[]> {
    try {
      // Create search query from cards
      const query = this.createSearchQuery(cards, context);

      // Search vector store
      const results = await vectorStoreService.searchSimilar(query, limit, {
        context
      });

      // Filter by similarity threshold
      return results.filter(r => r.similarity >= this.similarityThreshold);
    } catch (error) {
      console.error('Error searching interpretations:', error);
      return [];
    }
  }

  /**
   * Generate personalized reading using RAG
   */
  async generatePersonalizedReading(
    cards: CardInfo[],
    userContext: UserContext,
    readingType: string = 'general',
    context: string = 'general'
  ): Promise<PersonalizedReading> {
    try {
      // 1. Search for relevant interpretations
      const searchResults = await this.searchInterpretations(cards, context);

      // 2. Get base interpretations from database
      const baseInterpretations = await this.getBaseInterpretations(
        cards,
        searchResults
      );

      // 3. Build prompt context
      const promptContext = await this.buildPromptContext(
        cards,
        baseInterpretations,
        userContext
      );

      // 4. Generate personalized interpretation with LLM
      const { interpretation, usage } = await llmService.generatePersonalizedReading(
        promptContext,
        readingType,
        context
      );

      // 5. Extract keywords
      const keywords = this.extractKeywords(baseInterpretations);

      // 6. Generate follow-up questions (optional)
      const followUpQuestions = await llmService.generateFollowUpQuestions(
        interpretation,
        context
      );

      // 7. Calculate confidence score
      const confidence = this.calculateConfidence(searchResults);

      console.log(`✅ Generated personalized reading (${usage.inputTokens} + ${usage.outputTokens} tokens, $${usage.totalCost.toFixed(4)})`);

      return {
        interpretation,
        baseInterpretations: baseInterpretations.map(b => b.text),
        keywords,
        followUpQuestions,
        confidence,
        sources: searchResults.map(r => ({
          cardId: r.metadata.cardId,
          interpretationId: r.id,
          similarity: r.similarity
        }))
      };
    } catch (error) {
      console.error('Error generating personalized reading:', error);
      throw error;
    }
  }

  /**
   * Analyze card combination synergy
   */
  async analyzeCombination(cards: CardInfo[]): Promise<CombinationAnalysis> {
    try {
      if (cards.length < 2) {
        throw new Error('At least 2 cards are required for combination analysis');
      }

      // Search for combination interpretations
      const cardIds = cards.map(c => c.id);
      const results = await vectorStoreService.searchByCombination(
        cardIds,
        'combination'
      );

      // Get card details
      const cardDetails = await Promise.all(
        cards.map(async (card) => {
          const cardData = await TarotCard.findById(card.id);
          return {
            name: cardData?.name || card.name,
            nameKo: cardData?.nameKo || card.nameKo,
            orientation: card.orientation
          };
        })
      );

      // Analyze with LLM
      const analysis = await llmService.analyzeCombination(
        cardDetails,
        'combination'
      );

      // Extract synergies from results
      const synergy = this.extractSynergies(results, cards);

      // Generate practical advice
      const practicalAdvice = this.generatePracticalAdvice(analysis.analysis);

      return {
        overallMessage: analysis.analysis,
        synergy,
        keywords: analysis.keywords,
        practicalAdvice,
        energy: analysis.overallEnergy as 'positive' | 'challenging' | 'balanced'
      };
    } catch (error) {
      console.error('Error analyzing combination:', error);
      throw error;
    }
  }

  /**
   * Get interpretations for specific card and orientation
   */
  async getCardInterpretation(
    cardId: string,
    orientation: 'upright' | 'reversed',
    context: string = 'general'
  ): Promise<string[]> {
    try {
      const results = await vectorStoreService.searchByCard(
        cardId,
        orientation,
        context
      );

      return results
        .filter(r => r.similarity >= this.similarityThreshold)
        .map(r => r.interpretation);
    } catch (error) {
      console.error('Error getting card interpretation:', error);
      return [];
    }
  }

  /**
   * Create search query from cards
   */
  private createSearchQuery(cards: CardInfo[], context: string): string {
    const cardNames = cards.map(c => c.nameKo).join(', ');
    const orientations = cards.map(c =>
      c.orientation === 'upright' ? '정방향' : '역방향'
    ).join(', ');

    return `${context} 타로 리딩: ${cardNames} (${orientations})`;
  }

  /**
   * Get base interpretations from database and search results
   */
  private async getBaseInterpretations(
    cards: CardInfo[],
    searchResults: SearchResult[]
  ): Promise<Array<{ cardId: string; text: string; source: 'vector' | 'db' }>> {
    const interpretations: Array<{ cardId: string; text: string; source: 'vector' | 'db' }> = [];

    // Add vector search results
    searchResults.forEach(result => {
      interpretations.push({
        cardId: result.metadata.cardId,
        text: result.interpretation,
        source: 'vector'
      });
    });

    // Add direct database lookups for cards not in vector results
    for (const card of cards) {
      const hasResult = searchResults.some(r => r.metadata.cardId === card.id);

      if (!hasResult) {
        const dbInterpretations = await Interpretation.findByCard(
          card.id,
          card.orientation,
          'general'
        );

        if (dbInterpretations.length > 0) {
          interpretations.push({
            cardId: card.id,
            text: dbInterpretations[0].interpretation,
            source: 'db'
          });
        }
      }
    }

    return interpretations;
  }

  /**
   * Build prompt context for LLM
   */
  private async buildPromptContext(
    cards: CardInfo[],
    baseInterpretations: Array<{ text: string }>,
    userContext: UserContext
  ): Promise<PromptContext> {
    // Get full card details
    const cardDetails = await Promise.all(
      cards.map(async (card) => {
        const cardData = await TarotCard.findById(card.id);
        return {
          name: cardData?.name || card.name,
          nameKo: cardData?.nameKo || card.nameKo,
          orientation: card.orientation
        };
      })
    );

    // Combine base interpretations
    let combinedInterpretation = baseInterpretations
      .map(b => b.text)
      .join('\n\n');

    // Truncate if too long
    if (combinedInterpretation.length > this.maxContextLength) {
      combinedInterpretation = combinedInterpretation.substring(0, this.maxContextLength) + '...';
    }

    return {
      cards: cardDetails,
      baseInterpretation: combinedInterpretation,
      question: userContext.question,
      context: userContext.question ? this.inferContext(userContext.question) : 'general',
      age: userContext.age,
      userConcerns: userContext.concerns
    };
  }

  /**
   * Extract keywords from interpretations
   */
  private extractKeywords(
    interpretations: Array<{ text: string }>
  ): string[] {
    const keywords = new Set<string>();
    const commonKeywords = [
      '변화', '성장', '도전', '기회', '사랑', '관계', '성공', '행운',
      '균형', '선택', '용기', '희망', '지혜', '직관', '열정', '안정',
      '풍요', '창조', '통찰', '극복', '조화', '자유', '책임', '신뢰'
    ];

    interpretations.forEach(interp => {
      commonKeywords.forEach(keyword => {
        if (interp.text.includes(keyword)) {
          keywords.add(keyword);
        }
      });
    });

    return Array.from(keywords).slice(0, 8);
  }

  /**
   * Calculate confidence score based on search results
   */
  private calculateConfidence(results: SearchResult[]): number {
    if (results.length === 0) return 0.5; // Default confidence

    const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    const qualityScore = results.reduce((sum, r) =>
      sum + (r.metadata.qualityScore || 50), 0
    ) / results.length / 100;

    return (avgSimilarity + qualityScore) / 2;
  }

  /**
   * Infer context from user question
   */
  private inferContext(question: string): string {
    const lowerQ = question.toLowerCase();

    if (lowerQ.includes('사랑') || lowerQ.includes('연애') || lowerQ.includes('관계')) {
      return 'love';
    }
    if (lowerQ.includes('직장') || lowerQ.includes('일') || lowerQ.includes('커리어') || lowerQ.includes('돈')) {
      return 'career';
    }
    if (lowerQ.includes('건강') || lowerQ.includes('몸')) {
      return 'health';
    }
    if (lowerQ.includes('영적') || lowerQ.includes('명상') || lowerQ.includes('깨달음')) {
      return 'spiritual';
    }

    return 'general';
  }

  /**
   * Extract synergies from search results
   */
  private extractSynergies(
    results: SearchResult[],
    cards: CardInfo[]
  ): string[] {
    const synergies: string[] = [];

    // Look for combination-specific interpretations
    results.forEach(result => {
      if (result.metadata.combinationIds && result.metadata.combinationIds.length > 1) {
        synergies.push(result.interpretation.substring(0, 100) + '...');
      }
    });

    return synergies.slice(0, 3);
  }

  /**
   * Generate practical advice from analysis
   */
  private generatePracticalAdvice(analysis: string): string[] {
    // Extract sentences that seem like advice
    const sentences = analysis.split(/[.!?]/).filter(s => s.trim().length > 0);
    const adviceSentences = sentences.filter(s =>
      s.includes('조언') || s.includes('추천') || s.includes('권장') ||
      s.includes('해보세요') || s.includes('하세요') || s.includes('시도')
    );

    return adviceSentences.slice(0, 3);
  }
}

// Singleton instance
const ragService = new RAGService();

export default ragService;
export { RAGService, PersonalizedReading, CombinationAnalysis, CardInfo, UserContext };
