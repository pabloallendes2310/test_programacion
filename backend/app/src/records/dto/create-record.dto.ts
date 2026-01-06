import { IsString, IsDateString, IsNumber, IsOptional, MinLength, MaxLength, Min, IsIn } from "class-validator";

export class CreateRecordDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    sourceId: string;
    
    @IsDateString({}, { message: 'Fecha Invalida, Formato esperado YYYY-MM-DD' })
    date: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    category: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsString()
    @IsIn(['activo', 'pendiente', 'cancelado', 'completado'], {
        message: 'Status debe ser: activo, pendiente, cancelado o completado'
    })
    status: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;
}
