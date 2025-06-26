import { TicketType, TicketStatus, TicketCategory } from '@db/enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({
    enum: TicketType,
    description: 'Type of the ticket',
    example: TicketType.MANAGEMENT_REPORT,
  })
  @IsEnum(TicketType)
  @IsNotEmpty()
  type: TicketType;

  @ApiProperty({
    description: 'ID of the company the ticket belongs to',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  companyId: number;
}

export class TicketDto {
  @ApiProperty({
    description: 'Unique identifier of the ticket',
    example: 1,
  })
  id: number;

  @ApiProperty({
    enum: TicketType,
    description: 'Type of the ticket',
    example: TicketType.MANAGEMENT_REPORT,
  })
  type: TicketType;

  @ApiProperty({
    description: 'ID of the company the ticket belongs to',
    example: 1,
  })
  companyId: number;

  @ApiProperty({
    description: 'ID of the user assigned to the ticket',
    example: 1,
  })
  assigneeId: number;

  @ApiProperty({
    enum: TicketStatus,
    description: 'Current status of the ticket',
    example: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @ApiProperty({
    enum: TicketCategory,
    description: 'Category of the ticket',
    example: TicketCategory.ACCOUNTING,
  })
  category: TicketCategory;
}
