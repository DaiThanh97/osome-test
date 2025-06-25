import { Body, Controller, Get, Post } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketDto } from './dto/ticket.dto';

@Controller('api/v1/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  async findAll(): Promise<TicketDto[]> {
    return await this.ticketsService.findAll();
  }

  @Post()
  async create(@Body() createTicketDto: CreateTicketDto): Promise<TicketDto> {
    return await this.ticketsService.create(createTicketDto);
  }
}
