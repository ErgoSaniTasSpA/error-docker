import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrdersDto,CreateOrdersItemsDto,OrderPaginationDto,ProductDto,UpdateOrderStatusDto } from './dto/';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config';
import {  firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('OrderService');


  constructor(
    @Inject(NATS_SERVICE)
    private readonly productClient:ClientProxy ) {
    super();
  }

  async  onModuleInit() {
    this.logger.log('Database Connected')
    await this.$connect();
  }
  createOrder(createOrdersDto: CreateOrdersDto) {
     return this.order.create( {
      data : createOrdersDto
     } );
  }

  async createOrderItem(createOrdersItemsDto: CreateOrdersItemsDto) {


    try {

      //Obtienes todos los ProductId
      const productIds = createOrdersItemsDto.items.map( item => item.productId );
  
      //firstValueFrom : Ayuda a resolver el observable, valida todos los ids
      const products : any[] = await firstValueFrom(
        this.productClient.send ( { cmd : 'validateProducts'}, productIds )
      );

      //Acomula la cantidad Total
      const totalAmount = createOrdersItemsDto.items.reduce ( ( acc, orderItem) => {

        //Obtiene el precio de los productos
        const product = products.find( product => product.id === orderItem.productId ).price;
        
        return product *  orderItem.quantity; 
        
      },0);

      const totalItems = createOrdersItemsDto.items.reduce ( (acc , orderItem)  => {
        return acc + orderItem.quantity;
      },0);


      //Retorna todos los producto 
      const productData = createOrdersItemsDto.items.map ( (orderItem) => ({
        price     : products.find( (product) => product.id === orderItem.productId ).price,
        productId : orderItem.productId,
        quantity  : orderItem.quantity
      }))



      //Insertar a la Bdd una Order y varios productos 
      const order = await this.order.create ( {
        data : {
          totalAmount,
          totalItems,
          OrderItem : {
            createMany : { data : productData }
          }
        },
        include : {//Esto incluye a la query que agregue la relacion de la tabla "OrderItem"
          OrderItem : {
            select : {
              price : true,
              quantity : true,
              productId : true
            }
          }
        }
      });

      return {
        ...order,
        OrderItem : order.OrderItem.map( (orderItem) => ({
          ...orderItem,
          name : products.find ( (product) => product.id === orderItem.productId).name
        }))
      }
    }
    catch(error) {

      throw new RpcException({
        statusCode : HttpStatus.BAD_REQUEST,
        message : 'Error Validating Products'
      });
    
    }
 }

  async findAll(orderPaginationDto : OrderPaginationDto) {

    const { status,page,limit} = orderPaginationDto;
    
    //Consulta el total de order validas
    const totalPages = await this.order.count({
      where : { status : status }
    });

    // Busca todas las order segun el status  
    const order = await this.order.findMany( {
      skip : ( page -  1 ) * limit,
      take : limit,
      where : { status : status }
    });
    
    //Retorna toda la informacion necesaria 
    return {
      data : order,
      meta : {
        page,
        limit,
        total : totalPages,
        lastPage : Math.ceil( totalPages / limit)
      }
    } 

  }

  async findOne(id: string) {
    
    const order =  await this.order.findFirst( {
      where : { id },
    } );


    if (!order) {

      throw new RpcException({
        statusCode : HttpStatus.NOT_FOUND,
        message    : `Order With ID ${ id } Not Found`
      });

    }
    return order;
  }

  async findOneItem(id: string) {
    
    const order =  await this.order.findFirst( {
      where : { id },
      include : { //Esto incluye a la query que agregue la relacion de la tabla "OrderItem" 
        OrderItem : {
          select : {
            price : true,
            quantity : true,
            productId : true
          }
        }
      }
    } );


    if (!order) {

      throw new RpcException({
        statusCode : HttpStatus.NOT_FOUND,
        message    : `Order With ID ${ id } Not Found`
      });

    }

    const productIds = order.OrderItem.map ( orderItem => orderItem.productId);
     //firstValueFrom : Ayuda a resolver el observable, valida todos los ids
     const products : any[] = await firstValueFrom(
      this.productClient.send ( { cmd : 'validateProducts'}, productIds )
    );

    return {
      ...order,
      OrderItem : order.OrderItem.map( (orderItem) => ({
        ...orderItem,
        name : products.find ( (product) => product.id === orderItem.productId).name
      }))
    }


  }


  async updateStatus (updateOrderStatusDto:UpdateOrderStatusDto) {


    const { id, status } = updateOrderStatusDto;

    const order = await this.findOne (id);

    if( order.status === status) return order;

    return this.order.update( {
      where : { id },
      data : { status }
    });

  }

}
