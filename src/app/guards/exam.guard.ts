// guards/exam.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { ExamService } from '../service/exam.service';

@Injectable({
  providedIn: 'root'
})
export class ExamGuard implements CanActivate {
  constructor(
    private examService: ExamService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.examService.getExamState().pipe(
      take(1),
      map(state => {
        if (state.isExamStarted || state.isExamCompleted) {
          return true;
        }
        this.router.navigate(['/start']);
        return false;
      })
    );
  }
}
