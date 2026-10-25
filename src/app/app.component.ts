import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxRetroGridComponent } from '@omnedia/ngx-retro-grid';
import { RetroHeaderComponent } from '@layout/retro-header/retro-header.component';
import { ImageUploaderComponent } from '@features/upload/image-uploader.component';
import { GuidedTourComponent } from '@features/tour/guided-tour.component';
import { WorkstationComponent } from '@features/workstation/workstation.component';
import { SeoGuideSectionComponent } from '@features/guide/seo-guide-section.component';
import { WorkstationStateService, GuidedTourService } from '@core/services';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NgxRetroGridComponent,
    RetroHeaderComponent,
    ImageUploaderComponent,
    GuidedTourComponent,
    WorkstationComponent,
    SeoGuideSectionComponent
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {
  readonly state = inject(WorkstationStateService);
  readonly tourService = inject(GuidedTourService);

  @HostListener('window:paste', ['$event'])
  handlePaste(e: ClipboardEvent) {
    if (e.clipboardData && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        this.state.handleImageFile(file, false);
      }
    }
  }

  async handleSampleSelected(sample: { url: string; name: string }) {
    await this.state.loadSampleImage(sample);
    this.tourService.startGuidedTour(sample.name);
  }

  loadSamplePreset() {
    this.handleSampleSelected({
      url: 'samples/landscape-nature.jpg',
      name: 'mountain_landscape_4k'
    });
  }

  startGuidedTour() {
    if (!this.state.originalImage()) {
      this.loadSamplePreset();
      return;
    }
    this.tourService.startGuidedTour();
  }

  handleClear() {
    this.tourService.stopGuidedTour();
    this.state.clear();
  }

  scrollToGuide() {
    const el = document.getElementById('seo-guide');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
