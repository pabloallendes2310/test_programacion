import { Controller, Post, HttpCode, HttpStatus, Get, UseGuards } from '@nestjs/common';
import { PdfService } from './pdf.service';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('process')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async processPdf() {
    const pdfPath = path.join(__dirname, '..', '..', '..', '..', 'data', 'data.pdf');
    const result = await this.pdfService.processPdfFile(pdfPath);
    return { message: 'PDF procesado correctamente', ...result };
  }

  @Get('debug')
  async debugPdf() {
    try {
      const pdfPath = path.join(__dirname, '..', '..', '..', '..', 'data', 'data.pdf');
      const text = await this.pdfService.extractPdfText(pdfPath);

      return {
        text,
        lines: text.split('\n').slice(0, 50),
        totalLines: text.split('\n').length,
        path: pdfPath
      };
    } catch (error) {
      return { 
        error: (error as Error).message, 
        stack: (error as Error).stack 
      };
    }
  }
}
