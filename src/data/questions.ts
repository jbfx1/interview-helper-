export interface QuestionCategory {
  name: string;
  questions: string[];
}

export const questionCategories: QuestionCategory[] = [
  {
    name: 'Behavioral',
    questions: [
      'Tell me about a time you had to win buy-in from a skeptical stakeholder.',
      'Describe a situation where you handled competing priorities with limited resources.',
      'Share how you gave constructive feedback that changed a project outcome.'
    ]
  },
  {
    name: 'Technical',
    questions: [
      'How would you design a scalable voice transcription pipeline?',
      'Walk me through debugging a production outage caused by a memory leak.',
      'Explain how you ensure data privacy when working with AI assistants.'
    ]
  },
  {
    name: 'Leadership',
    questions: [
      'Describe how you set a compelling vision for your team.',
      'How do you coach underperformers while keeping morale high?',
      'Share a time you influenced executives without direct authority.'
    ]
  }
];
