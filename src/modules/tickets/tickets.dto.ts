import { TicketType, TicketStatus, TicketCategory } from '@db/enums';

export class CreateTicketDto {
  type: TicketType;
  companyId: number;
}

export class TicketDto {
  id: number;
  type: TicketType;
  companyId: number;
  assigneeId: number;
  status: TicketStatus;
  category: TicketCategory;
}
