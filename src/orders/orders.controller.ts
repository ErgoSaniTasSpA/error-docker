import { Controller, NotImplementedException, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrdersDto,CreateOrdersItemsDto,OrderPaginationDto,UpdateOrderStatusDto } from './dto/';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}



  @MessagePattern( { cmd : 'createOrders' }  )
  createOrder(@Payload() createOrdersDto: CreateOrdersDto) {
    return this.ordersService.createOrder(createOrdersDto);
  }

  @MessagePattern( { cmd : 'createOrdersItems' }  )
  createOrderItem(@Payload() createOrdersItemsDto: CreateOrdersItemsDto) {
    return this.ordersService.createOrderItem(createOrdersItemsDto);
  }

  @MessagePattern( { cmd : 'findAllOrders' } )
  findAll(orderPaginationDto:OrderPaginationDto) {
    return this.ordersService.findAll(orderPaginationDto);
  }

  @MessagePattern({ cmd : 'findOneOrder' })
  findOne(@Payload('id',ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern({ cmd : 'findOneOrderItem' })
  findOneItem(@Payload('id',ParseUUIDPipe) id: string) {
    return this.ordersService.findOneItem(id);
  }

  @MessagePattern({ cmd : 'changeOrderStatus' })
  changeOrderStatus(@Payload() updateOrdersStatusDto: UpdateOrderStatusDto ) {  
     return  this.ordersService.updateStatus(updateOrdersStatusDto);
  }
}
