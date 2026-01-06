import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('records')
@Index(['sourceId'],{unique : true})
export class Record {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'source_id' , unique: true, length: 100})
    sourceId: string;

    @Column({ type: 'date'})
    date : Date;

    @Column({length : 100})
    category : string;

    @Column({type: 'decimal', precision: 10 , scale: 2})
    amount : number;

    @Column({length: 50})
    status : string;

    @Column({type: 'text' , nullable: true})
    description : string;

    @CreateDateColumn({name : 'created_at'})
    createdAt: Date;

    @UpdateDateColumn({name: 'updated_at'})
    updatedAt: Date;

}
