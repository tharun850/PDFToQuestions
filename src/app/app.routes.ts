import { Routes } from '@angular/router';
import { ExamStarterComponent } from './components/exam-starter/exam-starter.component';
import { ExamComponent } from './components/exam/exam.component';
import { ExamGuard } from './guards/exam.guard';

export const routes: Routes = [
    { path: '', component: ExamStarterComponent },
    { 
        path: 'exam', 
        component: ExamComponent,
        canActivate: [ExamGuard]
    },
    { path: '**', redirectTo: '' }
];
