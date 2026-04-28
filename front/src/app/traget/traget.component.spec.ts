import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TragetComponent } from './traget.component';

describe('TragetComponent', () => {
  let component: TragetComponent;
  let fixture: ComponentFixture<TragetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TragetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TragetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
