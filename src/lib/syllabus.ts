import type { Syllabus } from './types';

export const allSyllabi: Syllabus[] = [
  {
    level: '0.0',
    subjects: {
      'Bengali': {
        marks: 30,
        topics: [
          'শিক্ষা ও মনুষত্ব্য - কাজী মোতাহের হোসেন চৌধুরী',
          'বই পড়া - প্রমথ চৌধুরী',
        ],
      },
      'English': {
        marks: 30,
        topics: ['IPA', 'A1 Vocabulary Book'],
      },
    }
  },
  {
    level: '1.0',
    subjects: {
        'Bengali': {
            marks: 20,
            topics: ['মমতাদি - মানিক বন্দ্যোপাধ্যায়', 'সনেট'],
        },
        'English': {
            marks: 20,
            topics: ['A2 Vocabulary', 'Basic Tense'],
        },
    }
  },
  {
    level: '1.1',
    subjects: {
        'Bengali': {
            marks: 20,
            topics: ['পথের পাঁচালী - বিভূতিভূষণ বন্দ্যোপাধ্যায়', 'পত্র রচনা'],
        },
        'English': {
            marks: 20,
            topics: ['A2 Reading Comprehension', 'Present Simple vs Continuous'],
        },
    }
  },
  {
    level: '1.2',
    subjects: {
        'Bengali': {
            marks: 20,
            topics: ['দেনাপাওনা - রবীন্দ্রনাথ ঠাকুর', 'প্রবন্ধ রচনা'],
        },
        'English': {
            marks: 20,
            topics: ['Past Simple', 'A2 Listening skills'],
        },
    }
  },
    {
    level: '1.3',
    subjects: {
        'Bengali': {
            marks: 20,
            topics: ['হৈমন্তী - রবীন্দ্রনাথ ঠাকুর', 'ভাবসম্প্রসারণ'],
        },
        'English': {
            marks: 20,
            topics: ['Future Tense (will vs going to)', 'A2 Vocabulary II'],
        },
    }
  },
  {
    level: '1.4',
    subjects: {
        'Bengali': {
            marks: 20,
            topics: ['মহেশ - শরৎচন্দ্র চট্টোপাধ্যায়', 'সারাংশ'],
        },
        'English': {
            marks: 20,
            topics: ['Prepositions of Place', 'A2 Speaking Practice'],
        },
    }
  },
  {
    level: '1.5',
    subjects: {
        'Bengali': {
            marks: 20,
            topics: ['একুশের গল্প - জহির রায়হান', 'কারক ও বিভক্তি'],
        },
        'English': {
            marks: 20,
            topics: ['Modals (can, could, may)', 'A2 Writing skills'],
        },
    }
  },
  {
    level: '1.6',
    subjects: {
        'Bengali': {
            marks: 20,
            topics: ['পদ্মা নদীর মাঝি - মানিক বন্দ্যোপাধ্যায়', 'সমাস'],
        },
        'English': {
            marks: 20,
            topics: ['Articles (a, an, the)', 'B1 Vocabulary'],
        },
    }
  },
  {
    level: '1.7',
    subjects: {
        'Bengali': {
            marks: 20,
            topics: ['অভাগীর স্বর্গ - শরৎচন্দ্র চট্টোপাধ্যায়', 'সন্ধি'],
        },
        'English': {
            marks: 20,
            topics: ['Adjectives and Adverbs', 'B1 Reading Comprehension'],
        },
    }
  },
  {
    level: '1.8',
    subjects: {
        'Bengali': {
            marks: 20,
            topics: ['কপোতাক্ষ নদ - মাইকেল মধুসূদন দত্ত', 'বাচ্য'],
        },
        'English': {
            marks: 20,
            topics: ['Present Perfect Tense', 'B1 Listening skills'],
        },
    }
  },
  {
    level: '1.9',
    subjects: {
        'Bengali': {
            marks: 20,
            topics: ['বিলাসী - শরৎচন্দ্র চট্টোপাধ্যায়', 'উক্তি পরিবর্তন'],
        },
        'English': {
            marks: 20,
            topics: ['Conditional Sentences (Type 1)', 'B1 Writing Practice'],
        },
    }
  },
  {
    level: '2.1',
    subjects: {
      'Bengali': {
        marks: 40,
        topics: [
          'আমার পথ - কাজী নজরুল ইসলাম',
          'জীবন ও বৃক্ষ - মোতাহের হোসেন চৌধুরী',
        ],
      },
      'English': {
        marks: 40,
        topics: ['B1 Vocabulary', 'Advanced Grammar'],
      },
    }
  },
  {
    level: '2.2',
    subjects: {
        'Bengali': {
            marks: 40,
            topics: [
                'আহ্বান - বিভূতিভূষণ বন্দ্যোপাধ্যায়',
                'আমার সন্তান - ভারতচন্দ্র রায়গুণাকর'
            ]
        },
        'English': {
            marks: 40,
            topics: [
                'Figurative Language',
                'B1 Reading Comprehension'
            ]
        }
    }
  }
  // More syllabi can be added here following the same structure
];
