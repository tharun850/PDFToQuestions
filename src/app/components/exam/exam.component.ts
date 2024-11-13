// components/exam.component.ts
import { Component, OnInit, OnDestroy, HostListener, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {  Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ExamService } from '../../service/exam.service';
import { ExamState } from '../../interface/exam-state';
import { Router } from '@angular/router';
import { QuestionModel } from '../../interface/question-model';
import { CommonModule } from '@angular/common';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons/faChevronLeft';
import { faUndo } from '@fortawesome/free-solid-svg-icons/faUndo';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ReportData } from '../../report-data';
import { faFileAlt, faPlay, faPrint, faRedo, faTimes } from '@fortawesome/free-solid-svg-icons';
import { animate, style, transition, trigger } from '@angular/animations';


@Component({
  selector: 'app-exam',
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.css',
  providers: [ Router ],
  imports: [ CommonModule, FontAwesomeModule],
  standalone: true,
  animations: [
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', 
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ]),
      transition(':leave', [
        animate('200ms ease-in', 
          style({ opacity: 0, transform: 'translateY(20px)' })
        )
      ])
    ])
  ]
})

export class ExamComponent implements OnInit, OnDestroy {

  faChevronRight = faChevronRight;
  faChevronLeft = faChevronLeft;
  faUndo = faUndo;

  private destroy$ = new Subject<void>();
  examState: ExamState;
  // questions: Question[] = [];
  currentQuestion!: QuestionModel;
  totalTime: number = 0; 

  options = ["A", "B", "C", "D"];

  questions!: QuestionModel[];

  reportData !: ReportData;

  showDetailedReportModal = false;
  faFileAlt = faFileAlt;
  faRedo = faRedo;
  faPlay = faPlay;
  faTimes = faTimes;
  faPrint = faPrint;

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.examService.isExamInProgress()) {
      $event.returnValue = true;
    }
  }

  constructor(public examService: ExamService,
    private router: Router
    ) {

    this.examState = {
      currentQuestion: 0,
      totalQuestions: 0,
      timeRemaining: 0,
      isExamStarted: false,
      isExamCompleted: false,
      score: 0
    };
  }

  ngOnInit() {
    if (this.examService.isExamInProgress()) {
      this.initializeState();
    }
  }



  initializeState() {

    this.examService.getExamState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state.isExamStarted && this.totalTime === 0) {
          this.totalTime = state.timeRemaining;
        }
        this.examState = state;
        this.updateCurrentQuestion();
      });

      this.examService.getQuestions()
      .pipe(takeUntil(this.destroy$))
      .subscribe(questions => {
        this.questions = questions;
        this.updateCurrentQuestion();
      });
  }


  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  startExam(): void {
    this.examService.startExam();
  }

  // submitAnswer(answerId: number): void {
  //   this.examService.submitAnswer(answerId);
  // }

  navigateToQuestion(index: number): void {
    this.examService.navigateToQuestion(index);
  }

  completeExam(): void {
    this.examService.completeExam(this.calculateScore());
  }

  resetExam(): void {
    this.examService.resetExam();
    this.initializeState();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  

  navigateToStart(): void {
    if (confirm('Are you sure you want to start a new exam?')) {
      this.examService.destroyCurrExam();
      this.router.navigate(['/']);
    }
  }

  navigateToNext(): void {
    const nextIndex = this.examState.currentQuestion + 1;
    if (nextIndex < this.examState.totalQuestions) {
      this.examService.navigateToQuestion(nextIndex);
    }
  }

  navigateToPrevious(): void {
    const prevIndex = this.examState.currentQuestion - 1;
    if (prevIndex >= 0) {
      this.examService.navigateToQuestion(prevIndex);
    }
  }

  // Add keyboard navigation
  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (this.examState.isExamStarted) {
      switch (event.key) {
        case 'ArrowLeft':
          this.navigateToPrevious();
          break;
        case 'ArrowRight':
          this.navigateToNext();
          break;
      }
    }
  }

  getQuestionStatus(index: number): string {
    if (index === this.examState.currentQuestion) {
      return 'current';
    }
    if (this.questions[index]?.selectedAnswer !== undefined) {
      return 'answered';
    }
    return 'unanswered';
  }

  get progress(): number {
    const answered = this.questions.filter(q => q.selectedAnswer !== undefined).length;
    return (answered / this.examState.totalQuestions) * 100;
  }

  submitExam(): void {
    if (confirm('Are you sure you want to submit the exam?')) {
      // Calculate score
      const score = this.calculateScore();
      
      // Update exam state with results
      this.examService.completeExam(score);
      this.reportData = this.examService.generateReport();

    }
  }

  calculateScore(): number {
    return this.questions.reduce((score, question) => {
      if (question.selectedAnswer === question.answer) {
        return score + 2;
      } else if(question.selectedAnswer !== undefined) {
        return parseFloat((score - 0.66).toFixed(2));
      }
      return score;
    }, 0);
  }

  reviewExam(): void {
    // Implement review functionality
    this.examService.setReviewMode(true);
    // You might want to show questions with correct/incorrect answers
  }

  restartExam(): void {
    if (confirm('Are you sure you want to start a new exam?')) {
      this.examService.resetExam();
      this.router.navigate(['/start']);
    }
  }

  private updateCurrentQuestion(): void {
    if(this.questions == null) return;
    if (this.questions.length > 0 && this.examState) {
      this.currentQuestion = this.questions[this.examState.currentQuestion];
    }
  }


  isOptionSelected(optionIndex: number): boolean {
    return this.currentQuestion?.selectedAnswer === this.options[optionIndex];
  }

  selectAnswer(optionIndex: number): void {
    if (this.currentQuestion) {
      // Update the selected answer in the current question
      this.currentQuestion.selectedAnswer = this.options[optionIndex];
      
      // Update the questions array
      this.questions[this.examState.currentQuestion] = {
        ...this.currentQuestion
      };
      
      // Notify the service about the answer
      this.examService.updateAnswer(this.examState.currentQuestion, this.options[optionIndex]);
    }
  }

  getProgress(): number {
    const answeredQuestions = this.questions.filter(q => q.selectedAnswer !== undefined).length;
    return (answeredQuestions / this.examState.totalQuestions) * 100;
  }

  // Add this method to get the count of answered questions
  getAnsweredQuestionsCount(): number {
    return this.questions.filter(q => q.selectedAnswer !== undefined).length;
  }

  getcorrectAnsweredQuestionsCount(): number {
    return this.questions.filter(q => q.selectedAnswer === q.answer).length;
  }

  getIncorrectAnsweredQuestionsCount(): number {
    return this.questions.filter(q => q.selectedAnswer !== undefined && q.selectedAnswer !== q.answer).length;
  }

  resetCurrentQuestion(): void {
    if (this.currentQuestion) {
      this.currentQuestion.selectedAnswer = undefined;
      
      this.questions[this.examState.currentQuestion] = {
        ...this.currentQuestion
      };

      this.examService.updateAnswer(this.examState.currentQuestion, undefined);
    }

  }

  hasCurrentQuestionAnswer(): boolean {
    return this.currentQuestion?.selectedAnswer !== undefined;
  }

  openDetailedReport() {
    this.showDetailedReportModal = true;
  }

  closeDetailedReport() {
    this.showDetailedReportModal = false;
  }

  getOptionClass(optionKey: string, question: QuestionModel): string {
    if(optionKey !== question.answer && optionKey === question.selectedAnswer){
      return 'incorrect';
    }
    if (optionKey === question.answer && optionKey === question.selectedAnswer) {
      return 'correctAndSelected';
    }
    if (optionKey === question.answer) {
      return 'correct';
    } 
    if (optionKey === question.selectedAnswer) {
      return 'selected';
    }
    if (question.selectedAnswer === undefined) {
      return 'unattempted';
    }
    return '';
  }

  printReport(){
    window.print();
  }

// printReport() {
//   const printContents = document.querySelector('.modal-content');
//   if (!printContents) return;

//   const originalContents = document.body.innerHTML;
//   const originalOverflow = document.body.style.overflow;

//   const styleSheet = `
//     <style>
//       body {
//         padding: 20px;
//         font-family: Arial, sans-serif;
//       }
//       .modal-content {
//         position: static;
//         width: 100%;
//         max-height: none;
//         overflow: visible;
//       }
//       .modal-body {
//         max-height: none;
//         overflow: visible;
//       }
//       @page {
//         size: A4;
//         margin: 2cm;
//       }
//     </style>
//   `;

//   document.body.innerHTML = styleSheet + printContents.outerHTML;
//   document.body.style.overflow = 'visible';

//   window.print();

//   document.body.innerHTML = originalContents;
//   document.body.style.overflow = originalOverflow;

//   this.reattachEventListeners();
// }

// private reattachEventListeners() {
//   const closeBtn = document.querySelector('.close-btn');
//   console.log(closeBtn)
//   if (closeBtn) {
//     console.log("hiiii")
//     closeBtn.addEventListener('click', this.closeDetailedReport);
//   }
//   console.log(closeBtn)
// }





}
