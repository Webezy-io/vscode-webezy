import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceGeneratorComponent } from './resource-generator.component';

describe('ResourceGeneratorComponent', () => {
  let component: ResourceGeneratorComponent;
  let fixture: ComponentFixture<ResourceGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResourceGeneratorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
