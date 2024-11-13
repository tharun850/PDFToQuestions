export interface ExamState {
    currentQuestion: number;
    totalQuestions: number;
    timeRemaining: number;
    isExamStarted: boolean;
    isExamCompleted: boolean;
    score: number;
    isReviewMode?: boolean;
}