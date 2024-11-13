export interface ReportData {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    score: number;
    timeTaken: number;
    questionsAnalysis: {
      questionNumber: number;
      isCorrect: boolean;
      userAnswer: string;
      correctAnswer: string;
      timeTaken?: number;
    }[];
  }
  