import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Question } from '../interface/question';
import { QuestionModel } from '../interface/question-model';

@Injectable({
  providedIn: 'root',
})
export class QuestionService {

  constructor(private http: HttpClient) {}

    getQuestions$(): Observable<QuestionModel[]> {
        return this.http.get<QuestionModel[]>('/assets/assets.json');
    }
}
