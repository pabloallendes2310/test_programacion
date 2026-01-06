import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { RecordsModule } from 'src/records/records.module';

@Module({
  imports:[RecordsModule],
  providers: [PdfService],
  controllers: [PdfController]
})
export class PdfModule {}
