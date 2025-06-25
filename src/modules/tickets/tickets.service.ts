import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Ticket } from '@db/models/Ticket';
import { User } from '@db/models/User';
import { Company } from '@db/models/Company';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketDto } from './dto/ticket.dto';
import { TicketType, TicketCategory, TicketStatus, UserRole } from '@db/enums';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket)
    private ticketModel: typeof Ticket,
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async findAll(): Promise<TicketDto[]> {
    return await this.ticketModel.findAll({
      include: [Company, User],
    });
  }

  async create(createTicketDto: CreateTicketDto): Promise<TicketDto> {
    const { type, companyId } = createTicketDto;

    const category =
      type === TicketType.MANAGEMENT_REPORT
        ? TicketCategory.ACCOUNTING
        : TicketCategory.CORPORATE;

    const userRole =
      type === TicketType.MANAGEMENT_REPORT
        ? UserRole.ACCOUNTANT
        : UserRole.CORPORATE_SECRETARY;

    const assignees = await this.userModel.findAll({
      where: { companyId, role: userRole },
      order: [['createdAt', 'DESC']],
    });

    if (!assignees.length) {
      throw new ConflictException(
        `Cannot find user with role ${userRole} to create a ticket`,
      );
    }

    if (userRole === UserRole.CORPORATE_SECRETARY && assignees.length > 1) {
      throw new ConflictException(
        `Multiple users with role ${userRole}. Cannot create a ticket`,
      );
    }

    const assignee = assignees[0];

    const ticket = await this.ticketModel.create({
      companyId,
      assigneeId: assignee.id,
      category,
      type,
      status: TicketStatus.OPEN,
    });

    return {
      id: ticket.id,
      type: ticket.type,
      assigneeId: ticket.assigneeId,
      status: ticket.status,
      category: ticket.category,
      companyId: ticket.companyId,
    };
  }
}
