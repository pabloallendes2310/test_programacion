import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { RecordsService } from '../records/records.service';
import { CreateRecordDto } from '../records/dto/create-record.dto';

@Injectable()
export class PdfService {
  constructor(private readonly recordsService: RecordsService) {}

  async extractPdfText(pdfPath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(pdfPath);
      
      const mod = require('pdf-parse');
      
      let pdfParse;
      
      if (typeof mod === 'function') {
        pdfParse = mod;
      } else if (mod.default && typeof mod.default === 'function') {
        pdfParse = mod.default;
      } else if (mod.PDFParse && typeof mod.PDFParse === 'function') {
        const instance = new mod.PDFParse();
        pdfParse = (buf: Buffer) => instance.parse(buf);
      } else {
        throw new Error(`pdf-parse no exporta función. Claves: ${Object.keys(mod).join(', ')}`);
      }
      
      const data = await pdfParse(buffer);
      
      if (!data || !data.text) {
        throw new Error('No se pudo extraer texto del PDF');
      }
      
      return data.text;
    } catch (error) {
      throw new BadRequestException(
        `Error al procesar PDF: ${(error as Error).message}`,
      );
    }
  }

  async processPdfFile(
    pdfPath: string,
  ): Promise<{ processed: number; errors: string[] }> {
    try {
      const text = await this.extractPdfText(pdfPath);

      await this.saveRawArtifacts(text);

      const records = this.parseAndNormalize(text);

      await this.saveNormalizedArtifacts(records);

      let processed = 0;
      const errors: string[] = [];

      for (const record of records) {
        try {
          await this.recordsService.upsert(record);
          processed++;
        } catch (error) {
          errors.push(
            `Error en ${record.sourceId}: ${(error as Error).message}`,
          );
        }
      }

      return { processed, errors };
    } catch (error) {
      throw new BadRequestException(
        `Error al procesar el PDF: ${(error as Error).message}`,
      );
    }
  }

  private async saveRawArtifacts(text: string): Promise<void> {
    try {
      const dataDir = path.join(__dirname, '..', '..', '..', 'data');
      await fs.mkdir(dataDir, { recursive: true });

      await fs.writeFile(
        path.join(dataDir, 'raw.json'),
        JSON.stringify({ text }, null, 2),
        'utf8',
      );

      const rawCsvValue = text.replace(/"/g, '""');
      const rawCsv = `text\n"${rawCsvValue}"`;
      await fs.writeFile(path.join(dataDir, 'raw.csv'), rawCsv, 'utf8');
    } catch (err) {
      console.warn('No se pudieron guardar artefactos RAW:', (err as Error).message);
    }
  }

  private async saveNormalizedArtifacts(records: CreateRecordDto[]): Promise<void> {
    try {
      const dataDir = path.join(__dirname, '..', '..', '..', 'data');
      await fs.mkdir(dataDir, { recursive: true });

      await fs.writeFile(
        path.join(dataDir, 'normalized.json'),
        JSON.stringify(records, null, 2),
        'utf8',
      );

      const headers: Array<keyof CreateRecordDto> = [
        'sourceId',
        'date',
        'category',
        'amount',
        'status',
        'description',
      ];

      const csvRows = [
        headers.join(','),
        ...records.map((r) =>
          headers
            .map((h) => {
              const v = (r as any)[h] ?? '';
              const s = String(v).replace(/"/g, '""');
              return `"${s}"`;
            })
            .join(','),
        ),
      ];

      await fs.writeFile(
        path.join(dataDir, 'normalized.csv'),
        csvRows.join('\n'),
        'utf8',
      );
    } catch (err) {
      console.warn('No se pudieron guardar artefactos normalizados:', (err as Error).message);
    }
  }

  private parseAndNormalize(text: string): CreateRecordDto[] {
    const records: CreateRecordDto[] = [];
    const rows = this.rebuildRows(text);

    const rowRegex =
      /^(INV-\d{4}-\d{3})(\d{2}-\d{2}-\d{4})([A-Za-záéíóúÁÉÍÓÚ]+)\$?([\d.,]+)(activo|pendiente|cancelado|completado)(.+)$/i;

    for (const row of rows) {
      const match = row.match(rowRegex);
      if (!match) continue;

      const [
        _,
        sourceId,
        date,
        category,
        amount,
        status,
        description,
      ] = match;

      try {
        records.push({
          sourceId: this.normalizeSourceId(sourceId),
          date: this.normalizeDate(date),
          category: this.normalizeCategory(category),
          amount: this.normalizeAmount(amount),
          status: this.normalizeStatus(status),
          description: description.trim(),
        });
      } catch {
        continue;
      }
    }

    return records;
  }


  private rebuildRows(text: string): string[] {
    const lines = text
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    const rows: string[] = [];
    let currentRow = '';

    const headerPatterns = [
      /Source\s*ID.*Fecha.*Categoría/i,
      /Source\s*ID.*Date.*Category/i,
      /Reporte\s+de\s+Transacciones/i,
      /^Source\s*ID$/i,
      /^Fecha$/i,
      /^Categoría$/i,
      /^Category$/i,
    ];

    for (const line of lines) {
      const isHeader = headerPatterns.some(pattern => pattern.test(line));
      
      if (isHeader) {
        continue;
      }
  
      if (line.startsWith('INV-')) {
        if (currentRow) {
          rows.push(currentRow.trim());
        }
        currentRow = line;
      } else if (currentRow) {
        currentRow += ' ' + line;
      }
    }

    if (currentRow) rows.push(currentRow.trim());

    return rows;
  }

  private normalizeSourceId(value: string): string {
    return value.trim().toUpperCase();
  }

  private normalizeDate(value: string): string {
    const [day, month, year] = value.split('-');
    return `${year}-${month}-${day}`;
  }

  private normalizeCategory(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  private normalizeAmount(value: string): number {
    const cleaned = value
      .replace(/\./g, '') 
      .replace(',', '.')  
      .trim();

    const amount = parseFloat(cleaned);
    if (isNaN(amount)) {
      throw new Error(`Monto inválido: ${value}`);
    }
    return amount;
  }

  private normalizeStatus(value: string): string {
    const map: Record<string, string> = {
      activo: 'activo',
      pendiente: 'pendiente',
      cancelado: 'cancelado',
      completado: 'completado',
    };

    return map[value.toLowerCase()] ?? value.toLowerCase();
  }
}
