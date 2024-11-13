// services/exam.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription, interval, of } from 'rxjs';
import { takeUntil, takeWhile } from 'rxjs/operators';
import { ExamState } from '../interface/exam-state';
import { QuestionModel } from '../interface/question-model';
import { ReportData } from '../report-data';

@Injectable({
  providedIn: 'root'
})
export class ExamService {

  private readonly EXAM_STATE_KEY = 'examState';
  private readonly EXAM_QUESTIONS_KEY = 'examQuestions';
  private readonly EXAM_START_TIME_KEY = 'examStartTime';

  private readonly TIME_PER_QUESTION = 1.2 * 60; // 1.2 minutes in seconds
  private totalTime = 0;
  private destroy$ = new Subject<void>();

  private examState = new BehaviorSubject<ExamState>(this.loadSavedState());
  private questions = this.loadSavedQuestions();
  private questions$ = new BehaviorSubject<QuestionModel[]>(this.loadSavedQuestions());
  private timerSubscription?: Subscription;

  private loadSavedState(): ExamState {
    const savedState = localStorage.getItem(this.EXAM_STATE_KEY);
    if (savedState) {
      return JSON.parse(savedState);
    }
    return {
      currentQuestion: 0,
      totalQuestions: 0,
      timeRemaining: 0,
      isExamStarted: false,
      isExamCompleted: false,
      score: 0
    };
  }

  private loadSavedQuestions(): QuestionModel[] {
    const savedQuestions = localStorage.getItem(this.EXAM_QUESTIONS_KEY);
    return savedQuestions && savedQuestions != "undefined" ? JSON.parse(savedQuestions) : [];
  }

  private saveState(state: ExamState): void {
    localStorage.setItem(this.EXAM_STATE_KEY, JSON.stringify(state));
  }
  
  private saveQuestions(questions: QuestionModel[]): void {
    if(localStorage.getItem(this.EXAM_QUESTIONS_KEY)) {
      localStorage.removeItem(this.EXAM_QUESTIONS_KEY);
    }
    localStorage.setItem(this.EXAM_QUESTIONS_KEY, JSON.stringify(questions));
    this.questions = questions;
  }

  constructor() {
    // Initialize visibility change handler
    // this.handleVisibilityChange();
    
    if (this.isExamInProgress()) {
      this.startTimer();
    }
  }

  getExamState(): Observable<ExamState> {
    return this.examState.asObservable();
  }

  getQuestions(): Observable<QuestionModel[]> {
    return of(this.questions);
  }

  isExamInProgress(): boolean {
    const currentState = this.examState.value;
    return currentState.isExamStarted && !currentState.isExamCompleted;
  }

  
  clearAllStorage(): void {
    this.questions = [];
    localStorage.removeItem(this.EXAM_STATE_KEY);
    localStorage.removeItem(this.EXAM_QUESTIONS_KEY); 
    localStorage.removeItem(this.EXAM_START_TIME_KEY);
  }  

  // Initialize exam with questions
  initializeExam(questions: QuestionModel[]): void {
    questions = this.shuffleQuestions(questions);
    const length = questions?.length;
    this.saveQuestions(questions);
    this.totalTime = Math.ceil(length* this.TIME_PER_QUESTION);
    this.questions$.next(questions);

    const newState: ExamState = {
      currentQuestion: 0,
      totalQuestions: length,
      timeRemaining: this.totalTime,
      isExamStarted: false,
      isExamCompleted: false,
      score: 0
    };
    
    this.examState.next(newState);
    this.saveState(newState);
  
  }

  // Start the exam
  startExam(): void {
    const currentState = this.examState.value;
    if (!currentState.isExamStarted) {
      const newState = {
        ...currentState,
        isExamStarted: true
      };
      this.examState.next(newState);
      this.saveState(newState);

      localStorage.setItem(this.EXAM_START_TIME_KEY, Date.now().toString());
      this.startTimer();
    }
  }

  updateAnswer(questionIndex: number, selectedAnswerStr: string | undefined): void {
    if (questionIndex >= 0 && questionIndex < this.questions.length) {
      this.questions[questionIndex] = {
        ...this.questions[questionIndex],
        selectedAnswer : selectedAnswerStr
      };
      this.saveQuestions(this.questions);
    }
  }

  // // Start the timer
  // private startTimer(): void {
  //   interval(1000)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe(() => {
  //       const currentState = this.examState.value;
  //       if (currentState.timeRemaining > 0) {
  //         this.examState.next({
  //           ...currentState,
  //           timeRemaining: currentState.timeRemaining - 1
  //         });
  //       } else {
  //         this.completeExamWithScore();
  //       }
  //     });
  // }

  private startTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    this.timerSubscription = interval(1000)
      .pipe(
        takeUntil(this.destroy$),
        takeWhile(() => {
          const currentState = this.examState.value;
          return currentState.isExamStarted && 
                 !currentState.isExamCompleted && 
                 currentState.timeRemaining > 0;
        })
      )
      .subscribe(() => {
        const currentState = this.examState.value;
        if (currentState.timeRemaining > 1) {
          const newState = {
            ...currentState,
            timeRemaining: currentState.timeRemaining - 1
          };
          this.examState.next(newState);
          this.saveState(newState);
        } else {
          this.completeExam(this.calculateScore());
        }
      });
  }

  // Get current exam state


  // Get current QuestionModel
  getCurrentQuestion(): QuestionModel {
    return this.questions[this.examState.value.currentQuestion];
  }

  // Get all questions
  getAllQuestions(): QuestionModel[] {
    return this.questions;
  }

  // Submit answer for current QuestionModel
  // submitAnswer(answerId: number): void {
  //   const currentIndex = this.examState.value.currentQuestion;
  //   this.questions[currentIndex].selectedAnswer = answerId;

  //   if (currentIndex < this.questions.length - 1) {
  //     this.examState.next({
  //       ...this.examState.value,
  //       currentQuestion: currentIndex + 1
  //     });
  //   }
  // }

  // Navigate to specific QuestionModel
  navigateToQuestion(index: number): void {
    if (index >= 0 && index < this.examState.value.totalQuestions) {
      this.examState.next({
        ...this.examState.value,
        currentQuestion: index
      });
    }
  }

  // Complete exam
  completeExamWithScore(): void {
    const score = this.calculateScore();
    this.destroy$.next();
    
    this.examState.next({
      ...this.examState.value,
      isExamCompleted: true,
      isExamStarted: false,
      score
    });
  }

  // Calculate score
  private calculateScore(): number {
    return this.questions.reduce((score, QuestionModel) => {
      if (QuestionModel.selectedAnswer === QuestionModel.answer) {
        return score + 2;
      } else if(QuestionModel.selectedAnswer !== undefined) {
        return score - 0.66;
      }
      return score;
    }, 0);
  }

  private shuffleQuestions(questions: QuestionModel[]): QuestionModel[] {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }



  // Reset exam
  resetExam(): void {
    this.destroy$.next();
    this.questions.forEach(QuestionModel => delete QuestionModel.selectedAnswer);
    this.initializeExam(this.questions);
    this.startExam();
  }

  destroyCurrExam(): void{
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    localStorage.removeItem(this.EXAM_STATE_KEY);
    localStorage.removeItem(this.EXAM_QUESTIONS_KEY);
    localStorage.removeItem(this.EXAM_START_TIME_KEY);
    
    this.examState.next({
      currentQuestion: 0,
      totalQuestions: 0,
      timeRemaining: 0,
      isExamStarted: false,
      isExamCompleted: false,
      score: 0
    });
    
    this.questions$.next([]);
  }

  // Cleanup
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.examState.complete();
  }

  debugState(): void {
    console.log('Current Exam State:', this.examState.value);
  }


  // Optional: Add method to check if navigation is possible
  canNavigateToNext(): boolean {
    return this.examState.value.currentQuestion < (this.examState.value.totalQuestions - 1);
  }

  canNavigateToPrevious(): boolean {
    return this.examState.value.currentQuestion > 0;
  }

  completeExam(score: number): void {

    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    const newState = {
      ...this.examState.value,
      isExamCompleted: true,
      isExamStarted: false,
      score
    };
    this.examState.next(newState);
    // this.destroy$.next();
    this.saveState(newState);
    localStorage.removeItem(this.EXAM_QUESTIONS_KEY); // Clear questions after completion
  }

  setReviewMode(enabled: boolean): void {
    this.examState.next({
      ...this.examState.value,
      isReviewMode: enabled
    });
  }

  generateReport(): ReportData {
    const questions = this.questions;
    const correctAnswers = questions.filter(q => q.selectedAnswer === q.answer).length;
    
    return {
      totalQuestions: questions.length,
      correctAnswers,
      incorrectAnswers: questions.length - correctAnswers,
      score: Math.round((correctAnswers / questions.length) * 100),
      timeTaken: this.totalTime - this.examState.value.timeRemaining,
      questionsAnalysis: questions.map((q, index) => ({
        questionNumber: index + 1,
        isCorrect: q.selectedAnswer === q.answer,
        userAnswer: q.selectedAnswer || '-',
        correctAnswer: q.answer,
      }))
    };
  }


}
