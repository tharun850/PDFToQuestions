// components/exam-starter.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { filter } from 'rxjs'; // Add this import
import { QuestionModel } from '../../interface/question-model';
import { FormsModule } from '@angular/forms';
import { PdfUploadComponentComponent } from '../pdf-upload-component/pdf-upload-component.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-exam-starter',
  standalone: true,
  templateUrl: './exam-starter.component.html',
  styleUrl: './exam-starter.component.css',
  imports: [PdfUploadComponentComponent, CommonModule, FormsModule],
  providers: [Router]
})
export class ExamStarterComponent implements OnInit {
  totalQuestions !: number;
  totalDuration!: number;
  pastedText : string = '';
  errorMessage !: string;

  constructor(
    private router: Router,
    private examService: ExamService,
  ) {
  }

  questions!: QuestionModel[];

  ngOnInit() {
    // Initialize exam with questions when component loads
    this.examService.clearAllStorage();
    // this.examService.initializeExam(this.questions);
  }


  formatTime(seconds: number): string {
    if (seconds === undefined || seconds === null) return '';
    const minutes = (Math.floor(seconds / 60)).toFixed(2);
    const remainingSeconds = (seconds % 60).toFixed(2);
    return `${minutes} minutes ${remainingSeconds} seconds`;
  }

  getQuestions(): void {
    this.totalQuestions = this.questions.length;
    this.totalDuration = this.totalQuestions * 1.2 * 60;
    this.examService.initializeExam(this.questions);
  }


  startExam(): void {
    this.examService.startExam();
    this.examService.getExamState()
      .pipe(
        filter(state => {
          return state.isExamStarted
        }
        ))
      .subscribe({
        next: () => {
          this.router.navigate(['/exam']);
        },
        error: (error) => {
          console.error('Error starting exam:', error);
        }
      });
  }

  onPdfUploadComplete(response: QuestionModel[]): void {
    this.questions = response;
    this.getQuestions();
  }

  async handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      this.pastedText = text;
      this.convertToQuestions(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  }

  getTextFromTextBox(){
    this.convertToQuestions(this.pastedText);
  }

  convertToQuestions(text: string) {
    try {
      const jsonData = JSON.parse(text);
      if (Array.isArray(jsonData)) {
        this.questions = jsonData;
        this.errorMessage = '';
        this.getQuestions();
        return;
      }
    } catch (e) {
      console.error('Invalid JSON format:', e);
      this.errorMessage = 'Invalid JSON format';
      this.questions = [];
    }
  }

  

}
