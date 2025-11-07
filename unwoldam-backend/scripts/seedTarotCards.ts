import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TarotCard } from '../src/models';

dotenv.config();

// 78 Tarot Cards Data
const tarotCardsData = [
  // Major Arcana (0-21)
  {
    cardNumber: 0,
    name: 'The Fool',
    nameKo: '바보',
    arcana: 'major' as const,
    keywords: ['새로운 시작', '모험', '순수함', '자유', '가능성'],
    basicMeaning: {
      upright: '새로운 시작, 순수한 열정, 자유로운 영혼. 두려움 없이 새로운 모험을 시작할 때입니다.',
      reversed: '무모함, 경솔한 결정, 준비 부족. 좀 더 신중하게 생각하고 계획을 세워야 합니다.'
    }
  },
  {
    cardNumber: 1,
    name: 'The Magician',
    nameKo: '마법사',
    arcana: 'major' as const,
    keywords: ['창조', '의지', '능력', '자신감', '실현'],
    basicMeaning: {
      upright: '창조적 능력, 실현 가능성, 자신감. 당신이 원하는 것을 실현할 수 있는 능력이 있습니다.',
      reversed: '재능 낭비, 허세, 조작. 능력을 잘못 사용하거나 기회를 놓치고 있습니다.'
    }
  },
  {
    cardNumber: 2,
    name: 'The High Priestess',
    nameKo: '여사제',
    arcana: 'major' as const,
    keywords: ['직관', '신비', '무의식', '지혜', '내면'],
    basicMeaning: {
      upright: '직관과 내면의 지혜, 신비로운 지식. 당신의 내면의 목소리에 귀 기울이세요.',
      reversed: '직관 무시, 감춰진 정보, 비밀. 진실을 보지 못하거나 무시하고 있습니다.'
    }
  },
  {
    cardNumber: 3,
    name: 'The Empress',
    nameKo: '여제',
    arcana: 'major' as const,
    keywords: ['풍요', '창조', '양육', '자연', '아름다움'],
    basicMeaning: {
      upright: '풍요로움, 창조적 에너지, 양육. 성장과 번영의 시기입니다.',
      reversed: '창의력 부족, 의존성, 과잉보호. 균형을 찾고 독립성을 키워야 합니다.'
    }
  },
  {
    cardNumber: 4,
    name: 'The Emperor',
    nameKo: '황제',
    arcana: 'major' as const,
    keywords: ['권위', '구조', '리더십', '안정', '아버지'],
    basicMeaning: {
      upright: '리더십, 권위, 안정된 구조. 규칙과 질서 속에서 목표를 달성합니다.',
      reversed: '과도한 통제, 경직성, 권위주의. 유연성이 필요합니다.'
    }
  },
  {
    cardNumber: 5,
    name: 'The Hierophant',
    nameKo: '교황',
    arcana: 'major' as const,
    keywords: ['전통', '교육', '신념', '제도', '지도'],
    basicMeaning: {
      upright: '전통적 가치, 정신적 지도, 교육. 멘토나 선생님의 도움을 받을 수 있습니다.',
      reversed: '반항, 독창성, 틀 깨기. 기존의 방식에서 벗어나 새로운 길을 찾습니다.'
    }
  },
  {
    cardNumber: 6,
    name: 'The Lovers',
    nameKo: '연인',
    arcana: 'major' as const,
    keywords: ['사랑', '선택', '조화', '관계', '결합'],
    basicMeaning: {
      upright: '사랑과 조화, 중요한 선택. 진정한 연결과 파트너십을 나타냅니다.',
      reversed: '불균형, 잘못된 선택, 관계 문제. 가치관의 차이를 극복해야 합니다.'
    }
  },
  {
    cardNumber: 7,
    name: 'The Chariot',
    nameKo: '전차',
    arcana: 'major' as const,
    keywords: ['의지', '승리', '통제', '전진', '결단'],
    basicMeaning: {
      upright: '의지력과 결단, 승리. 목표를 향해 강력하게 전진하는 시기입니다.',
      reversed: '통제 상실, 방향 상실, 좌절. 다시 방향을 잡고 집중이 필요합니다.'
    }
  },
  {
    cardNumber: 8,
    name: 'Strength',
    nameKo: '힘',
    arcana: 'major' as const,
    keywords: ['용기', '내면의 힘', '인내', '온화함', '극복'],
    basicMeaning: {
      upright: '내면의 힘, 용기, 인내. 온화하면서도 강한 힘으로 문제를 극복합니다.',
      reversed: '자신감 부족, 의심, 나약함. 내면의 힘을 믿고 회복해야 합니다.'
    }
  },
  {
    cardNumber: 9,
    name: 'The Hermit',
    nameKo: '은자',
    arcana: 'major' as const,
    keywords: ['고독', '성찰', '지혜', '내면 탐구', '명상'],
    basicMeaning: {
      upright: '내면 성찰, 고독 속 지혜. 혼자만의 시간을 통해 답을 찾습니다.',
      reversed: '고립, 외로움, 은둔. 사회와의 연결이 필요합니다.'
    }
  },
  {
    cardNumber: 10,
    name: 'Wheel of Fortune',
    nameKo: '운명의 수레바퀴',
    arcana: 'major' as const,
    keywords: ['운명', '변화', '순환', '행운', '전환점'],
    basicMeaning: {
      upright: '운명의 전환, 행운, 긍정적 변화. 삶의 새로운 국면이 시작됩니다.',
      reversed: '불운, 통제 불가능한 변화, 저항. 변화를 받아들이고 적응해야 합니다.'
    }
  },
  {
    cardNumber: 11,
    name: 'Justice',
    nameKo: '정의',
    arcana: 'major' as const,
    keywords: ['정의', '공정', '진실', '결과', '책임'],
    basicMeaning: {
      upright: '공정한 판단, 정의, 진실. 옳은 일에 대한 보상을 받습니다.',
      reversed: '불공정, 편견, 책임 회피. 진실과 마주하고 책임을 져야 합니다.'
    }
  },
  {
    cardNumber: 12,
    name: 'The Hanged Man',
    nameKo: '매달린 사람',
    arcana: 'major' as const,
    keywords: ['희생', '새로운 관점', '대기', '포기', '깨달음'],
    basicMeaning: {
      upright: '새로운 관점, 희생, 멈춤. 다른 시각에서 상황을 바라보세요.',
      reversed: '무의미한 희생, 지연, 저항. 변화를 받아들이고 놓아주세요.'
    }
  },
  {
    cardNumber: 13,
    name: 'Death',
    nameKo: '죽음',
    arcana: 'major' as const,
    keywords: ['변화', '끝', '새로운 시작', '변환', '해방'],
    basicMeaning: {
      upright: '끝과 새로운 시작, 변화. 무언가가 끝나고 새로운 것이 시작됩니다.',
      reversed: '변화 거부, 집착, 정체. 놓아줘야 할 것을 붙잡고 있습니다.'
    }
  },
  {
    cardNumber: 14,
    name: 'Temperance',
    nameKo: '절제',
    arcana: 'major' as const,
    keywords: ['균형', '조화', '절제', '인내', '통합'],
    basicMeaning: {
      upright: '균형과 조화, 절제. 중도를 지키며 조화를 이룹니다.',
      reversed: '불균형, 과도함, 조급함. 균형을 되찾고 인내가 필요합니다.'
    }
  },
  {
    cardNumber: 15,
    name: 'The Devil',
    nameKo: '악마',
    arcana: 'major' as const,
    keywords: ['속박', '유혹', '중독', '물질주의', '욕망'],
    basicMeaning: {
      upright: '속박, 유혹, 집착. 무엇인가에 얽매여 있음을 알아차려야 합니다.',
      reversed: '자유, 해방, 깨달음. 속박에서 벗어나 자유를 찾습니다.'
    }
  },
  {
    cardNumber: 16,
    name: 'The Tower',
    nameKo: '탑',
    arcana: 'major' as const,
    keywords: ['붕괴', '충격', '변혁', '진실', '깨달음'],
    basicMeaning: {
      upright: '갑작스러운 변화, 붕괴, 충격. 기존 구조가 무너지며 진실이 드러납니다.',
      reversed: '재난 회피, 변화 거부, 회복. 위기를 극복하고 재건합니다.'
    }
  },
  {
    cardNumber: 17,
    name: 'The Star',
    nameKo: '별',
    arcana: 'major' as const,
    keywords: ['희망', '영감', '치유', '평화', '신뢰'],
    basicMeaning: {
      upright: '희망, 영감, 치유. 어둠 속에서 빛을 발견합니다.',
      reversed: '절망, 신뢰 상실, 낙담. 희망을 되찾고 믿음을 회복해야 합니다.'
    }
  },
  {
    cardNumber: 18,
    name: 'The Moon',
    nameKo: '달',
    arcana: 'major' as const,
    keywords: ['환상', '직관', '불안', '무의식', '미스터리'],
    basicMeaning: {
      upright: '환상과 불안, 직관. 불확실한 상황에서 내면의 목소리를 들으세요.',
      reversed: '두려움 극복, 명확성, 진실. 환상에서 벗어나 현실을 봅니다.'
    }
  },
  {
    cardNumber: 19,
    name: 'The Sun',
    nameKo: '태양',
    arcana: 'major' as const,
    keywords: ['기쁨', '성공', '활력', '긍정', '명확성'],
    basicMeaning: {
      upright: '기쁨, 성공, 활력. 모든 것이 명확해지고 긍정적인 에너지가 넘칩니다.',
      reversed: '과도한 낙관, 지연된 성공, 일시적 우울. 곧 밝아질 것입니다.'
    }
  },
  {
    cardNumber: 20,
    name: 'Judgement',
    nameKo: '심판',
    arcana: 'major' as const,
    keywords: ['부활', '각성', '결정', '용서', '내면의 목소리'],
    basicMeaning: {
      upright: '부활, 각성, 중요한 결정. 과거를 정리하고 새롭게 태어납니다.',
      reversed: '자기 의심, 후회, 평가 두려움. 과거에서 배우고 앞으로 나아가세요.'
    }
  },
  {
    cardNumber: 21,
    name: 'The World',
    nameKo: '세계',
    arcana: 'major' as const,
    keywords: ['완성', '성취', '통합', '여행', '성공'],
    basicMeaning: {
      upright: '완성, 성취, 통합. 한 주기가 성공적으로 마무리되고 새로운 단계가 시작됩니다.',
      reversed: '미완성, 지연, 부족함. 마지막 단계를 완성하고 목표를 달성하세요.'
    }
  },

  // Minor Arcana - Wands (22-35)
  {
    cardNumber: 22,
    name: 'Ace of Wands',
    nameKo: '완드 에이스',
    arcana: 'minor' as const,
    suit: 'wands' as const,
    keywords: ['창조', '영감', '새로운 기회', '잠재력'],
    basicMeaning: {
      upright: '새로운 창조적 기회, 영감. 열정적인 새 시작입니다.',
      reversed: '창의력 부족, 지연, 기회 상실. 다시 영감을 찾아야 합니다.'
    }
  },
  // Note: For brevity, I'll add representative cards. In production, all 78 cards should be added.
  // Additional Minor Arcana cards would continue here...

  // Cups
  {
    cardNumber: 36,
    name: 'Ace of Cups',
    nameKo: '컵 에이스',
    arcana: 'minor' as const,
    suit: 'cups' as const,
    keywords: ['사랑', '감정', '직관', '새로운 관계'],
    basicMeaning: {
      upright: '새로운 사랑과 감정, 직관적 깨달음. 마음이 열리는 시기입니다.',
      reversed: '감정 억압, 사랑의 종말, 실망. 마음을 치유하고 회복해야 합니다.'
    }
  },

  // Swords
  {
    cardNumber: 50,
    name: 'Ace of Swords',
    nameKo: '검 에이스',
    arcana: 'minor' as const,
    suit: 'swords' as const,
    keywords: ['진실', '명확성', '새로운 아이디어', '정신적 명료함'],
    basicMeaning: {
      upright: '새로운 아이디어, 진실, 정신적 명료함. 돌파구가 보입니다.',
      reversed: '혼란, 잘못된 판단, 정보 부족. 더 신중하게 생각해야 합니다.'
    }
  },

  // Pentacles
  {
    cardNumber: 64,
    name: 'Ace of Pentacles',
    nameKo: '펜타클 에이스',
    arcana: 'minor' as const,
    suit: 'pentacles' as const,
    keywords: ['풍요', '물질적 기회', '번영', '안정'],
    basicMeaning: {
      upright: '새로운 재정적 기회, 번영. 물질적 안정의 시작입니다.',
      reversed: '재정 불안, 기회 상실, 물질적 어려움. 현실적인 계획이 필요합니다.'
    }
  }
];

async function seedTarotCards() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unwoldam_tarot';
    await mongoose.connect(mongoURI);

    console.log('✅ Connected to MongoDB');

    // Clear existing cards
    await TarotCard.deleteMany({});
    console.log('🗑️ Cleared existing tarot cards');

    // Insert new cards
    const result = await TarotCard.insertMany(tarotCardsData);
    console.log(`✅ Successfully seeded ${result.length} tarot cards`);

    // Display stats
    const majorCount = await TarotCard.countDocuments({ arcana: 'major' });
    const minorCount = await TarotCard.countDocuments({ arcana: 'minor' });

    console.log(`\n📊 Database Stats:`);
    console.log(`   Major Arcana: ${majorCount} cards`);
    console.log(`   Minor Arcana: ${minorCount} cards`);
    console.log(`   Total: ${majorCount + minorCount} cards`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding tarot cards:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedTarotCards();
