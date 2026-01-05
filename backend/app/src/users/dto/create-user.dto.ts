import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsBoolean } from "class-validator";
export class CreateUserDto {

    @IsEmail({}, {message: 'email invalido'})
    email : string;

    @IsString()
    @MinLength(6, {message: 'la contra debe tener almenos  caracteres'})
    @MaxLength(50)
    password: string;
    
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
    
}
