import Anthropic from '@anthropic-ai/sdk';
import { PROMPT_TEMPLATES, PromptContext, getPromptTemplate } from '../../utils/promptTemplates';
import dotenv from 'dotenv';

dotenv.config();

interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalCost: number; // in USD
}

class LLMService {
  private client: Anthropic;
  private model: string;
  private totalTokensUsed: { input: number; output: number } = {
    input: 0,
    output: 0
  };

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-test-key'
    });

    this.model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  }

  /**
   * Generate text using Claude API
   */
  async generate(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<{ text: string; usage: TokenUsage }> {
    try {
      const {
        maxTokens = 1024,
        temperature = 0.7,
        systemPrompt = PROMPT_TEMPLATES.systemPrompt()
      } = options;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: maxTokens,
        temperature: temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const text = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      const usage = this.calculateUsage(response.usage);

      // Track total usage
      this.totalTokensUsed.input += usage.inputTokens;
      this.totalTokensUsed.output += usage.outputTokens;

      return { text, usage };
    } catch (error) {
      console.error('Error generating text with Claude:', error);
      throw error;
    }
  }

  /**
   * Generate personalized tarot reading
   */
  async generatePersonalizedReading(
    promptContext: PromptContext,
    readingType: string = 'general',
    context: string = 'general'
  ): Promise<{ interpretation: string; usage: TokenUsage }> {
    const prompt = getPromptTemplate(readingType, context, promptContext);

    const result = await this.generate(prompt, {
      maxTokens: 1024,
      temperature: 0.8 // More creative for personalized readings
    });

    return {
      interpretation: result.text,
      usage: result.usage
    };
  }

  /**
   * Transform interpretation to MZ style
   */
  async transformToMZStyle(
    baseInterpretation: string,
    context: string = 'general'
  ): Promise<string> {
    const prompt = `
다음 타로 해석을 한국 MZ세대가 공감할 수 있는 따뜻하고 친근한 스타일로 다시 작성해주세요.

원본 해석:
${baseInterpretation}

맥락: ${context}

요구사항:
- 존댓말 사용
- 이모지 적절히 활용 (과하지 않게)
- 실용적이고 구체적인 조언 포함
- 150-250자 이내
- 따뜻하고 공감적인 톤

변환된 해석:`;

    const result = await this.generate(prompt, {
      maxTokens: 512,
      temperature: 0.7
    });

    return result.text;
  }

  /**
   * Analyze card combination synergy
   */
  async analyzeCombination(
    cards: Array<{ name: string; nameKo: string; orientation: string }>,
    context: string = 'general'
  ): Promise<{
    analysis: string;
    keywords: string[];
    overallEnergy: string;
  }> {
    const prompt = PROMPT_TEMPLATES.combinationAnalysis({
      cards,
      context
    });

    const result = await this.generate(prompt, {
      maxTokens: 800,
      temperature: 0.7
    });

    // Extract keywords from analysis
    const keywords = this.extractKeywords(result.text);

    return {
      analysis: result.text,
      keywords,
      overallEnergy: this.determineOverallEnergy(cards)
    };
  }

  /**
   * Generate follow-up questions based on reading
   */
  async generateFollowUpQuestions(
    readingInterpretation: string,
    context: string
  ): Promise<string[]> {
    const prompt = `
다음 타로 리딩 결과를 바탕으로, 사용자가 더 깊이 탐구할 수 있는 후속 질문 3가지를 제안해주세요.

리딩 결과:
${readingInterpretation}

맥락: ${context}

요구사항:
- 각 질문은 한 줄로
- 사용자의 성찰을 돕는 질문
- 구체적이고 실용적인 질문
- 긍정적인 방향으로

질문들:`;

    const result = await this.generate(prompt, {
      maxTokens: 256,
      temperature: 0.8
    });

    // Parse questions from response
    const questions = result.text
      .split('\n')
      .filter(line => line.trim().length > 0)
      .filter(line => line.match(/^\d+\./) || line.includes('?'))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 3);

    return questions;
  }

  /**
   * Enhance interpretation with user context
   */
  async enhanceWithContext(
    baseInterpretation: string,
    userContext: {
      age?: number;
      previousReadings?: string[];
      concerns?: string[];
    }
  ): Promise<string> {
    const contextInfo = [];

    if (userContext.age) {
      contextInfo.push(`연령대: ${userContext.age}대`);
    }

    if (userContext.concerns && userContext.concerns.length > 0) {
      contextInfo.push(`관심사: ${userContext.concerns.join(', ')}`);
    }

    const prompt = `
다음 타로 해석을 사용자의 상황에 맞게 개인화해주세요.

기본 해석:
${baseInterpretation}

사용자 정보:
${contextInfo.join('\n')}

요구사항:
- 사용자의 상황에 공감하는 표현 사용
- 연령대에 맞는 언어와 예시
- 실천 가능한 구체적 조언
- 200-300자 이내

개인화된 해석:`;

    const result = await this.generate(prompt, {
      maxTokens: 512,
      temperature: 0.7
    });

    return result.text;
  }

  /**
   * Calculate token usage and cost
   */
  private calculateUsage(usage: {
    input_tokens: number;
    output_tokens: number;
  }): TokenUsage {
    // Claude 3.5 Sonnet pricing (as of 2024)
    const inputCostPer1M = 3.0; // $3 per 1M input tokens
    const outputCostPer1M = 15.0; // $15 per 1M output tokens

    const inputCost = (usage.input_tokens / 1_000_000) * inputCostPer1M;
    const outputCost = (usage.output_tokens / 1_000_000) * outputCostPer1M;

    return {
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      totalCost: inputCost + outputCost
    };
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction
    const keywords: string[] = [];
    const commonKeywords = [
      '변화', '성장', '도전', '기회', '사랑', '관계', '성공', '행운',
      '균형', '선택', '용기', '희망', '지혜', '직관', '열정', '안정'
    ];

    commonKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        keywords.push(keyword);
      }
    });

    return keywords.slice(0, 5);
  }

  /**
   * Determine overall energy from cards
   */
  private determineOverallEnergy(
    cards: Array<{ orientation: string }>
  ): string {
    const uprightCount = cards.filter(c => c.orientation === 'upright').length;
    const reversedCount = cards.length - uprightCount;

    if (uprightCount > reversedCount) {
      return 'positive';
    } else if (reversedCount > uprightCount) {
      return 'challenging';
    } else {
      return 'balanced';
    }
  }

  /**
   * Get total token usage statistics
   */
  getTotalUsage(): {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  } {
    const totalTokens = this.totalTokensUsed.input + this.totalTokensUsed.output;
    const estimatedCost = this.calculateUsage({
      input_tokens: this.totalTokensUsed.input,
      output_tokens: this.totalTokensUsed.output
    }).totalCost;

    return {
      inputTokens: this.totalTokensUsed.input,
      outputTokens: this.totalTokensUsed.output,
      totalTokens,
      estimatedCost
    };
  }

  /**
   * Reset usage statistics
   */
  resetUsage(): void {
    this.totalTokensUsed = { input: 0, output: 0 };
  }
}

// Singleton instance
const llmService = new LLMService();

export default llmService;
export { LLMService, TokenUsage, GenerateOptions };
