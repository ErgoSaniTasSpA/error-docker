import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive } from "class-validator";
import { OrderStatusList } from "../enum/order.enum";
import { OrderStatus } from "@prisma/client";

export class CreateOrdersDto {


    @IsNumber()
    totalAmount : number;

    @IsNumber()
    @IsPositive()
    totalItems : number;

    @IsEnum(OrderStatusList,{
        message : `Possible Status Values Are ${OrderStatusList}`
    })
    @IsOptional()
    status : OrderStatus = OrderStatus.PENDING;

    @IsBoolean()
    @IsOptional()
    paid : boolean = false;

}
