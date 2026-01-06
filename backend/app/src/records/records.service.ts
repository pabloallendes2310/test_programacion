import { Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  InjectRepository
} from '@nestjs/typeorm'
import { Repository } from 'typeorm';
import { Record } from 'src/entities/record.entity';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';

@Injectable()
export class RecordsService {

  constructor(
    @InjectRepository(Record)
    private recordsRepository: Repository<Record>,
  ) {}

  async create(createRecordDto: CreateRecordDto) : Promise<Record> {
    const existing = await this.recordsRepository.findOne({
      where: { sourceId: createRecordDto.sourceId}
    })
    if( existing ){
      throw new ConflictException(
        `Record con sourceId ${createRecordDto.sourceId} ya existe`
      )
    }
    const record = this.recordsRepository.create(createRecordDto);

    return this.recordsRepository.save(record)
  }

  async upsert(createRecordDto: CreateRecordDto): Promise<Record>{
    const existing = await this.recordsRepository.findOne({
      where: {sourceId: createRecordDto.sourceId},
    })

    if(existing){
      Object.assign(existing,createRecordDto)
      return this.recordsRepository.save(existing)
    }else{
      const record = this.recordsRepository.create(createRecordDto);
      return this.recordsRepository.save(record)
    }

  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: Record[]; total: number; page: number; limit: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options?.category) where.category = options.category;
    if (options?.status) where.status = options.status;
    
    const queryBuilder = this.recordsRepository.createQueryBuilder('record');
    
    if (options?.category) {
      queryBuilder.andWhere('record.category = :category', { category: options.category });
    }
    if (options?.status) {
      queryBuilder.andWhere('record.status = :status', { status: options.status });
    }
    if (options?.startDate) {
      queryBuilder.andWhere('record.date >= :startDate', { startDate: options.startDate });
    }
    if (options?.endDate) {
      queryBuilder.andWhere('record.date <= :endDate', { endDate: options.endDate });
    }

    const [data, total] = await queryBuilder
      .orderBy('record.date', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: number) : Promise<Record> {
    const record = await this.recordsRepository.findOne({
      where : {id}
    })
    if(!record){
      throw new NotFoundException(`record con ${id} No existe`)
    }
    return record;
  }

  async update(id: number, updateRecordDto: UpdateRecordDto) : Promise<Record> {
    const record = await this.findOne(id)
    Object.assign(record,updateRecordDto)
    return this.recordsRepository.save(record)
  }

  async remove(id: number) : Promise<void> {
    const record = await this.findOne(id)
    await this.recordsRepository.remove(record)
  }

  async removeAll(): Promise<void>{
    await this.recordsRepository.clear()
  }

  async getStats(): Promise<any> {
    const total = await this.recordsRepository.count();
    
    const byStatus = await this.recordsRepository
      .createQueryBuilder('record')
      .select('record.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('record.status')
      .getRawMany();

    const byCategory = await this.recordsRepository
      .createQueryBuilder('record')
      .select('record.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(record.amount)', 'total')
      .groupBy('record.category')
      .getRawMany();

    const totalAmount = await this.recordsRepository
      .createQueryBuilder('record')
      .select('SUM(record.amount)', 'total')
      .getRawOne();

    return {
      total,
      totalAmount: parseFloat(totalAmount?.total || '0'),
      byStatus,
      byCategory,
    };
  }

  async findBycategory(category: string): Promise<Record[]>{
    return this.recordsRepository.find({
      where : {category},
      order : {date : 'DESC'}
    });
  }

  async findByStatus(status: string): Promise<Record[]>{
    return this.recordsRepository.find({
      where : {status},
      order : { date:'DESC'}
    })
  }
}
