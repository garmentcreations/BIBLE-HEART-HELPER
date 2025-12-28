
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { JournalEntryRequest, AnalysisResponse, NudgeRequest, NudgeResponse, WeeklyAnalysisRequest, WeeklyAnalysisResponse, ReflectionMode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CHILD_FRIENDLY_SYSTEM_INSTRUCTION = `
Role: You are a friendly, encouraging Bible helper for kids (approx. 10 years old). 
Tone: Warm, simple, cheerful, and protective.
Language: 4th-grade reading level. No complex theological terms. 
Goal: Connect the user's situation to God's love.

PERSONALIZATION RULE: 
You must speak DIRECTLY to the child using "You" and "Your". 
NEVER use "We", "Us", or "Our" (e.g., do NOT say "When we feel sad...", say "When you feel sad..."). 
Make the user feel like this message is written specifically for them right now.
`;

// Organized Verse Banks for Randomization
const VERSE_BANKS = {
  BLUE: [
    '"Though my father and mother forsake me, the Lord will receive me." (Psalm 27:10)',
    '"I will not leave you as orphans; I will come to you." (John 14:18)',
    '"I am with you and will watch over you wherever you go." (Genesis 28:15)',
    '"The Lord himself goes before you and will be with you; he will never leave you nor forsake you." (Deuteronomy 31:8)',
    '"God sets the lonely in families." (Psalm 68:6)',
    '"I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit." (John 15:5)',
    '"Come to me, all you who are weary and burdened, and I will give you rest." (Matthew 11:28)',
    '"The Lord is close to the brokenhearted and saves those who are crushed in spirit." (Psalm 34:18)',
    '"The Lord is my strength and my shield; my heart trusts in him, and he helps me." (Psalm 28:7)',
    '"Even though I walk through the darkest valley, I will fear no evil, for you are with me." (Psalm 23:4)',
    '"Who shall separate us from the love of Christ?" (Romans 8:35)',
    '"Can a mother forget the baby at her breast... Though she may forget, I will not forget you!" (Isaiah 49:15)',
    '"Turn to me and be gracious to me, for I am lonely and afflicted." (Psalm 25:16)',
    '"Be strong and courageous... for the Lord your God goes with you." (Deuteronomy 31:6)',
    '"Look at the birds of the air... Are you not much more valuable than they?" (Matthew 6:26)',
    '"And surely I am with you always, to the very end of the age." (Matthew 28:20)'
  ],
  RED: [
    '"Refrain from anger and turn from wrath; do not fret—it leads only to evil." (Psalm 37:8)',
    '"A gentle answer turns away wrath, but a harsh word stirs up anger." (Proverbs 15:1)',
    '"A hot-tempered person stirs up conflict, but the one who is patient calms a quarrel." (Proverbs 15:18)',
    '"Do not be quickly provoked in your spirit, for anger resides in the lap of fools." (Ecclesiastes 7:9)',
    '"Everyone should be quick to listen, slow to speak and slow to become angry." (James 1:19)',
    '"A fool gives full vent to their rage, but the wise bring calm in the end." (Proverbs 29:11)',
    '"Better a patient person than a warrior, one with self-control than one who takes a city." (Proverbs 16:32)',
    '"In your anger do not sin: Do not let the sun go down while you are still angry." (Ephesians 4:26)',
    '"Get rid of all bitterness, rage and anger, brawling and slander, along with every form of malice." (Ephesians 4:31)',
    '"But now you must also rid yourselves of all such things as these: anger, rage, malice, slander, and filthy language from your lips." (Colossians 3:8)',
    '"An angry person stirs up conflict, and a hot-tempered person commits many sins." (Proverbs 29:22)',
    '"A person’s wisdom yields patience; it is to one’s glory to overlook an offense." (Proverbs 19:11)',
    '"Fools show their annoyance at once, but the prudent overlook an insult." (Proverbs 12:16)',
    '"Whoever is patient has great understanding, but one who is quick-tempered displays folly." (Proverbs 14:29)',
    '"A quick-tempered person does foolish things, and the one who devises evil schemes is hated." (Proverbs 14:17)',
    '"A hot-tempered person must pay the penalty; rescue them, and you will have to do it again." (Proverbs 19:19)'
  ],
  PINK: [
    '"Give thanks to the Lord, for he is good; his love endures forever." (Psalm 107:1)',
    '"First, I thank my God through Jesus Christ for all of you." (Romans 1:8)',
    '"Enter his gates with thanksgiving and his courts with praise." (Psalm 100:4)',
    '"Give thanks in all circumstances; for this is God’s will for you in Christ Jesus." (1 Thessalonians 5:18)',
    '"Give, and it will be given to you." (Luke 6:38)',
    '"Let the peace of Christ rule in your hearts... And be thankful." (Colossians 3:15)',
    '"And whatever you do... do it all in the name of the Lord Jesus, giving thanks to God." (Colossians 3:17)',
    '"I always thank my God for you because of his grace given you in Christ Jesus." (1 Corinthians 1:4)',
    '"But thanks be to God! He gives us the victory through our Lord Jesus Christ." (1 Corinthians 15:57)',
    '"I will praise you, Lord, with all my heart; I will tell of all your wonderful deeds." (Psalm 111:1)',
    '"I will praise you forever for what you have done." (Psalm 52:9)',
    '"Rejoice always, pray continually, give thanks in all circumstances." (1 Thessalonians 5:16-18)',
    '"Yours, Lord, is the greatness and the power and the glory." (1 Chronicles 29:11)',
    '"I will give thanks to you, Lord, with all my heart." (Psalm 9:1)',
    '"It is good to praise the Lord and make music to your name, O Most High." (Psalm 92:1)',
    '"Thanks be to God for his indescribable gift!" (2 Corinthians 9:15)'
  ],
  GREEN: [
    '"The Lord is my shepherd, I lack nothing." (Psalm 23:1)',
    '"Trust in the Lord with all your heart and lean not on your own understanding." (Proverbs 3:5)',
    '"But the Lord is faithful, and he will strengthen you and protect you from the evil one." (2 Thessalonians 3:3)',
    '"I lift up my eyes to the mountains—where does my help come from?" (Psalm 121:1-2)',
    '"When anxiety was great within me, your consolation brought me joy." (Psalm 94:19)',
    '"Therefore do not worry about tomorrow, for tomorrow will worry about itself." (Matthew 6:34)',
    '"Cast all your anxiety on him because he cares for you." (1 Peter 5:7)',
    '"Do not be anxious about anything, but in every situation... present your requests to God." (Philippians 4:6)',
    '"I sought the Lord, and he answered me; he delivered me from all my fears." (Psalm 34:4)',
    '"But blessed is the one who trusts in the Lord, whose confidence is in him." (Jeremiah 17:7)',
    '"The Lord is my light and my salvation—whom shall I fear?" (Psalm 27:1)',
    '"The Lord gives strength to his people; the Lord blesses his people with peace." (Psalm 29:11)',
    '"Peace I leave with you; my peace I give you... Do not let your hearts be troubled." (John 14:27)',
    '"But seek first his kingdom and his righteousness." (Matthew 6:33)',
    '"Make it your ambition to lead a quiet life." (1 Thessalonians 4:11)',
    '"Say to those with fearful hearts, \'Be strong, do not fear; your God will come.\'" (Isaiah 35:4)'
  ],
  YELLOW: [
    '"Delight yourself in the Lord, and he will give you the desires of your heart." (Psalm 37:4)',
    '"A cheerful heart is good medicine, but a crushed spirit dries up the bones." (Proverbs 17:22)',
    '"The joy of the Lord is your strength." (Nehemiah 8:10)',
    '"Rejoice in the Lord always. I will say it again: Rejoice!" (Philippians 4:4)',
    '"You will fill me with joy in your presence." (Psalm 16:11)',
    '"May the God of hope fill you with all joy and peace as you trust in him." (Romans 15:13)',
    '"But may the righteous be glad and rejoice before God." (Psalm 68:3)',
    '"Let the heavens rejoice, let the earth be glad." (Psalm 96:11)',
    '"I know that there is nothing better for people than to be happy and to do good while they live." (Ecclesiastes 3:12)',
    '"Be joyful in hope, patient in affliction, faithful in prayer." (Romans 12:12)',
    '"The Lord will watch over your coming and going both now and forevermore." (Psalm 121:8)',
    '"Though you have not seen him, you love him... and are filled with an inexpressible and glorious joy." (1 Peter 1:8)',
    '"This is the day the Lord has made; let us rejoice and be glad in it." (Psalm 118:24)',
    '"Clap your hands, all you nations; shout to God with cries of joy." (Psalm 47:1)',
    '"Shout for joy to the Lord, all the earth." (Psalm 100:1)',
    '"Light in a messenger’s eyes brings joy to the heart." (Proverbs 15:30)'
  ],
  PURPLE: [
    '"The Lord is close to the brokenhearted and saves those who are crushed in spirit." (Psalm 34:18)',
    '"He heals the brokenhearted and binds up their wounds." (Psalm 147:3)',
    '"Weeping may stay for the night, but rejoicing comes in the morning." (Psalm 30:5)',
    '"Blessed are those who mourn, for they will be comforted." (Matthew 5:4)',
    '"My flesh and my heart may fail, but God is the strength of my heart and my portion forever." (Psalm 73:26)',
    '"Record my misery; list my tears on your scroll." (Psalm 56:8)',
    '"I will speak out in the anguish of my spirit, I will complain in the bitterness of my soul." (Job 7:11)',
    '"Praise be to the God... who comforts us in all our troubles." (2 Corinthians 1:3-4)',
    '"Have mercy on me, Lord, for I am faint." (Psalm 6:2)',
    '"Why, my soul, are you downcast? Put your hope in God." (Psalm 42:5)',
    '"He will wipe every tear from their eyes." (Revelation 21:4)',
    '"Jesus wept." (John 11:35)',
    '"Cast your cares on the Lord and he will sustain you." (Psalm 55:22)',
    '"The Lord is a refuge for the oppressed, a stronghold in times of trouble." (Psalm 9:9)',
    '"In this world you will have trouble. But take heart! I have overcome the world." (John 16:33)',
    '"Hear my cry, O God; listen to my prayer... lead me to the rock that is higher than I." (Psalm 61:1-2)'
  ]
};

// Helper to shuffle array
function shuffleArray(array: string[]) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate the system instruction with shuffled verses each time
const getAnalyzerInstruction = () => {
  const shuffledBanks = {
    BLUE: shuffleArray(VERSE_BANKS.BLUE).map((v, i) => `${i + 1}. ${v}`).join('\n'),
    RED: shuffleArray(VERSE_BANKS.RED).map((v, i) => `${i + 1}. ${v}`).join('\n'),
    PINK: shuffleArray(VERSE_BANKS.PINK).map((v, i) => `${i + 1}. ${v}`).join('\n'),
    GREEN: shuffleArray(VERSE_BANKS.GREEN).map((v, i) => `${i + 1}. ${v}`).join('\n'),
    YELLOW: shuffleArray(VERSE_BANKS.YELLOW).map((v, i) => `${i + 1}. ${v}`).join('\n'),
    PURPLE: shuffleArray(VERSE_BANKS.PURPLE).map((v, i) => `${i + 1}. ${v}`).join('\n'),
  };

  return `
${CHILD_FRIENDLY_SYSTEM_INSTRUCTION}

Categorization Logic (The Digital Jar): You must map every emotion to one of the six color-coded categories found in the physical jar.

CRITICAL INSTRUCTION: If the user's input matches one of the following keywords, you MUST map it to the corresponding color category listed below. Do not deviate from this mapping for these specific words.

RED (Angry): "Angry", "Mad", "Annoyed", "Frustrated", "Furious", "Upset".
YELLOW (Happy): "Happy", "Excited", "Joyful", "Cheerful", "Good", "Hopeful", "Delighted".
PINK (Thankful): "Thankful", "Blessed", "Glad", "Grateful", "Appreciative".
GREEN (Anxious): "Anxious", "Worried", "Scared", "Nervous", "Restless", "Uneasy", "Panic".
BLUE (Lonely): "Lonely", "Left Out", "All Alone", "Empty", "Forgotten", "Unwanted".
PURPLE (Sad): "Sad", "Gloomy", "Down", "Unhappy", "Heartbroken", "Tearful".

For feelings not listed above, use the following logic:
YELLOW (Happy): For feelings like Energetic, Cheerful, or Excited.
PINK (Thankful): For feelings like Thankful, Blessed, or Glad.
RED (Angry): For feelings like Mad, Annoyed, or Frustrated.
GREEN (Anxious): For feelings like Worried, Scared, or Nervous.
BLUE (Lonely): For feelings like Lonely, Left Out, or Sad & Alone.
PURPLE (Sad): For feelings like Sad, Gloomy, or Unhappy.

FORMATTING RULE FOR VERSES:
The 'primary_verse' field MUST always follow this format: "Verse text goes here" (Book Chapter:Verse).
It is CRITICAL that you include the Book, Chapter, and Verse reference at the end of the string. 
DO NOT output the verse text without the citation.
Example: "The Lord is my shepherd." (Psalm 23:1)

RANDOMIZATION INSTRUCTION:
I have provided SHUFFLED lists of verses below. 
For the detected color category, you MUST SELECT THE FIRST VERSE from the corresponding list below.
Since the list is shuffled every time, picking the top one ensures randomness for the user.

MANDATORY VERSE BANK (BLUE / LONELY):
${shuffledBanks.BLUE}

MANDATORY VERSE BANK (RED / ANGRY):
${shuffledBanks.RED}

MANDATORY VERSE BANK (PINK / THANKFUL):
${shuffledBanks.PINK}

MANDATORY VERSE BANK (GREEN / ANXIOUS):
${shuffledBanks.GREEN}

MANDATORY VERSE BANK (YELLOW / HAPPY):
${shuffledBanks.YELLOW}

MANDATORY VERSE BANK (PURPLE / SAD):
${shuffledBanks.PURPLE}
`;
};

export const alignHeart = async (request: JournalEntryRequest): Promise<AnalysisResponse> => {
  // We generate a fresh, randomized system instruction for every request
  const dynamicInstruction = getAnalyzerInstruction();

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this journal entry for a young student: "${request.transcript}". Timestamp: ${request.timestamp}. RandomID: ${Math.random()}.
    Keep the 'deep_dive_reflection' and 'prayer_prompt' very simple and easy to read. 
    IMPORTANT: 'primary_verse' must be chosen from the provided bank for the detected color.
    IMPORTANT: Write the 'deep_dive_reflection' TO the user (using "You"), not about us ("We").
    IMPORTANT: Write the 'prayer_prompt' AS the user talking TO God (using "I", "Me", "My"). Do not use "You" to refer to the user in the prayer.`,
    config: {
      systemInstruction: dynamicInstruction,
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detected_heart_state: {
            type: Type.OBJECT,
            properties: {
              quadrant: { type: Type.STRING },
              specific_emotion: { type: Type.STRING },
              jar_color: { type: Type.STRING, enum: ['YELLOW', 'PINK', 'RED', 'GREEN', 'BLUE', 'PURPLE', 'NEUTRAL'] },
            },
            required: ['quadrant', 'specific_emotion', 'jar_color'],
          },
          context_tags: {
            type: Type.OBJECT,
            properties: {
              activity: { type: Type.STRING },
              companions: { type: Type.STRING },
              location: { type: Type.STRING },
            },
            required: ['activity', 'companions', 'location'],
          },
          biblical_response: {
            type: Type.OBJECT,
            properties: {
              primary_verse: { type: Type.STRING },
              deep_dive_reflection: { type: Type.STRING },
              prayer_prompt: { type: Type.STRING },
            },
            required: ['primary_verse', 'deep_dive_reflection', 'prayer_prompt'],
          },
          disclaimer: { type: Type.STRING },
        },
        required: ['detected_heart_state', 'context_tags', 'biblical_response', 'disclaimer'],
      },
    },
  });

  if (response.text) {
    const cleanText = response.text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText) as AnalysisResponse;
  }
  throw new Error("Failed to generate analysis");
};

export const generateReflectionPrompt = async (emotion: string, mode: ReflectionMode = 'reflect'): Promise<string> => {
  let promptContext = "";
  
  switch (mode) {
    case 'reframe':
        promptContext = `The user is feeling "${emotion}". Help them view this situation through the lens of faith. Generate a question that gently shifts their perspective to how God might be working or present in this moment. (e.g., "Where might Jesus be in this moment with you?")`;
        break;
    case 'action':
        promptContext = `The user is feeling "${emotion}". Suggest a very small, simple, Spirit-led action they can take. It should focus on connection with God or kindness to others. Phrase it as a gentle invitation. (e.g., "What if you took a moment to pray for...")`;
        break;
    case 'affirmation':
        promptContext = `The user is feeling "${emotion}". Generate 2 short, powerful "Biblical Declarations" based on scripture that directly counter or support this feeling with God's truth. 
        Format: "Here are two biblical declarations:\n\"[Declaration 1]\"\n\"[Declaration 2]\""
        These should be "I am" statements rooted in what God says about them (e.g., "I am a child of God", "I am never alone"). Do not give generic affirmations.`;
        break;
    case 'trap':
        promptContext = `The user is feeling "${emotion}". Help them check if they are believing a lie vs. God's truth. Ask a gentle checking question to identify a common thinking trap (like assuming the worst or forgetting God's presence).`;
        break;
    case 'reflect':
    default:
        promptContext = `Generate a short, insightful, single-sentence journaling prompt for a user who is feeling "${emotion}". The prompt should help them reflect on *why* they are feeling this way and invite Jesus into that feeling.`;
        break;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `${promptContext}
    Speak directly to the user using "You".
    Keep it simple, deep, Christ-centered, and encouraging.`,
    config: {
      systemInstruction: CHILD_FRIENDLY_SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            prompt: { type: Type.STRING }
        }
      }
    }
  });

  if (response.text) {
    const json = JSON.parse(response.text);
    return json.prompt;
  }
  return `What thoughts are on your mind regarding feeling ${emotion}?`;
};

export const generateNudge = async (request: NudgeRequest): Promise<NudgeResponse> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a spiritual nudge for a child (10 years old). 
    Context:
    - Time of Day: ${request.time_of_day}
    - User's Goal: ${request.user_goal}
    - Check-in Streak: ${request.check_in_streak} days
    - Recent Feeling: ${request.recent_dominant_emotion || 'Neutral'}
    
    Make the 'in_app_nudge' text very short, warm, and biblical.`,
    config: {
      systemInstruction: CHILD_FRIENDLY_SYSTEM_INSTRUCTION,
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          notification: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              body: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: ['title', 'body', 'category'],
          },
          in_app_nudge: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              associated_jar_color: { type: Type.STRING, enum: ['YELLOW', 'PINK', 'RED', 'GREEN', 'BLUE', 'PURPLE', 'NEUTRAL'] },
            },
            required: ['text', 'associated_jar_color'],
          },
        },
        required: ['notification', 'in_app_nudge'],
      },
    },
  });

  if (response.text) {
    const cleanText = response.text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText) as NudgeResponse;
  }
  throw new Error("Failed to generate nudge");
};

export const generateWeeklyAnalysis = async (request: WeeklyAnalysisRequest): Promise<WeeklyAnalysisResponse> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze these past entries for a child student: ${JSON.stringify(request.past_entries)}. Use simple language suitable for a 10 year old.`,
    config: {
      systemInstruction: CHILD_FRIENDLY_SYSTEM_INSTRUCTION,
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dominant_color: { type: Type.STRING },
          trend_summary: { type: Type.STRING },
          environmental_insight: { type: Type.STRING },
          spiritual_mission: {
            type: Type.OBJECT,
            properties: {
              focus_area: { type: Type.STRING },
              deep_study_passage: { type: Type.STRING },
              practical_discipline: { type: Type.STRING },
            },
            required: ['focus_area', 'deep_study_passage', 'practical_discipline'],
          },
        },
        required: ['dominant_color', 'trend_summary', 'environmental_insight', 'spiritual_mission'],
      },
    },
  });

  if (response.text) {
    const cleanText = response.text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText) as WeeklyAnalysisResponse;
  }
  throw new Error("Failed to generate weekly analysis");
};

export const generateSpeech = async (text: string): Promise<string> => {
  if (!text || text.trim().length === 0) {
     throw new Error("Text is empty");
  }

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: {
            parts: [{ text: text }]
        },
        config: {
        responseModalities: ['AUDIO' as Modality], // Force string to avoid import issues
        speechConfig: {
            voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
        return base64Audio;
    }
    throw new Error("No audio returned from service");
  } catch (error) {
    console.error("Generate Speech Failed:", error);
    throw error;
  }
};
