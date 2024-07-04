import { Type } from "class-transformer";
import { IsString } from "class-validator";


export class ProductDto {

    @Type(() => Number )
    public id: number;
  
    @IsString()
    public name: string;
  
    @Type(() => Number )
    public price: number;

    @IsString()
    public createdAt: string;

    @IsString()
    public updatedAt: string;
}