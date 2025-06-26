import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto, TicketDto } from './tickets.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all tickets',
    description: 'Retrieves all tickets in the system without pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all tickets',
    type: [TicketDto],
  })
  async findAll(): Promise<TicketDto[]> {
    return await this.ticketsService.findAll();
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new ticket',
    description:
      'Creates a new ticket with the specified type for a company. The assignee is determined based on ticket type and company users.',
  })
  @ApiBody({ type: CreateTicketDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The ticket has been successfully created',
    type: TicketDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Conflict - Cannot create ticket due to business rule violation (e.g., duplicate ticket, multiple users with same role, etc.)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Not Found - Cannot find user with required role to create a ticket',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request - Invalid input data',
  })
  async create(@Body() createTicketDto: CreateTicketDto): Promise<TicketDto> {
    return await this.ticketsService.create(createTicketDto);
  }
}
