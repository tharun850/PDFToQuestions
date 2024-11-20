import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders } from '@angular/common/http';
import { QuestionModel } from '../../interface/question-model';


@Component({
  selector: 'app-pdf-upload-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-upload-component.component.html',
  styleUrl: './pdf-upload-component.component.css'
})
export class PdfUploadComponentComponent {
  @Output() uploadComplete = new EventEmitter<QuestionModel[]>();
  
  selectedFile: File | null = null;
  uploadProgress: number = 0;
  isDragging: boolean = false;
  errorMessage: string = '';
  apiResponse: any = null;
  isLoading: boolean = false;

  constructor(private http: HttpClient) {}

  onDragOver(event: DragEvent): void {
    if (this.isLoading) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    if (this.isLoading) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any): void {
    if (this.isLoading) return;
    if (event.target.files.length > 0) {
      this.handleFile(event.target.files[0]);
    }
  }

  private handleFile(file: File): void {
    if (file.type !== 'application/pdf') {
      this.errorMessage = 'Please select a PDF file';
      return;
    }

    if (file.size > 30000000) { // 30MB limit
      this.errorMessage = 'File size should not exceed 5MB';
      return;
    }

    this.selectedFile = file;
    this.errorMessage = '';
    this.uploadFile();
  }

  private uploadFile(): void {
    if (!this.selectedFile) return;

    this.isLoading = true;
    this.uploadProgress = 0;
    this.apiResponse = null;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post<QuestionModel[]>('https://pdf-to-questions-latest.onrender.com/rest/processPdf', formData, {
      reportProgress: true,
      observe: 'events',
      responseType: 'json'
    }).subscribe({
      next: (event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.Sent:
            console.log('Request sent!');
            break;
          
          case HttpEventType.UploadProgress:
            if (event.total) {
              this.uploadProgress = Math.round((event.loaded * 100) / event.total);
              console.log(`Upload Progress: ${this.uploadProgress}%`);
            }
            break;
          
          case HttpEventType.ResponseHeader:
            console.log('Response header received!');
            break;

          case HttpEventType.DownloadProgress:
            console.log('Response download in progress!');
            break;
          
          case HttpEventType.Response:
            console.log('😊 Request successful!', event.body);
            this.apiResponse = event.body;
            this.uploadComplete.emit(event.body);
            this.isLoading = false;
            break;
        }
      },
      error: (error) => {
        console.error('Upload failed:', error);
        this.errorMessage = this.getErrorMessage(error);
        this.uploadProgress = 0;
        this.isLoading = false;
      },
      complete: () => {
        console.log('Upload completed');
        if (!this.apiResponse) {
          this.isLoading = false;
        }
      }
    });
  }

  private getErrorMessage(error: any): string {
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      return `Error: ${error.error.message}`;
    } else {
      // Server-side error
      return `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
  }
}
