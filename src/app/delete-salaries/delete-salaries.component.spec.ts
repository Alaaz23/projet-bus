import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteSalariesComponent } from './delete-salaries.component';

describe('DeleteSalariesComponent', () => {
  let component: DeleteSalariesComponent;
  let fixture: ComponentFixture<DeleteSalariesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteSalariesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeleteSalariesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
