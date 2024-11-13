import { Component } from '@angular/core';
import { ExamComponent } from '../exam/exam.component';
import { ExamStarterComponent } from "../exam-starter/exam-starter.component";

@Component({
  selector: 'app-screen',
  imports: [ ExamStarterComponent],
  standalone: true,
  templateUrl: './screen.component.html',
  styleUrl: './screen.component.css'
})
export class ScreenComponent {

}
