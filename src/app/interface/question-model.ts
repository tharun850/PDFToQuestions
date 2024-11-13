import { QuestionOptions } from "./question-options";

export interface QuestionModel {
    questionId: string;
    question: string;
    options: QuestionOptions;
    answer: 'A' | 'B' | 'C' | 'D';  // Making answer more type-safe
    explain: string;
    selectedAnswer?: string;
}