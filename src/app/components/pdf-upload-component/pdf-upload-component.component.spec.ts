import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfUploadComponentComponent } from './pdf-upload-component.component';

describe('PdfUploadComponentComponent', () => {
  let component: PdfUploadComponentComponent;
  let fixture: ComponentFixture<PdfUploadComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfUploadComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfUploadComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
