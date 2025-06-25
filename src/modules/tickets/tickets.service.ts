import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Ticket } from '@db/models/Ticket';
import { User } from '@db/models/User';
import { Company } from '@db/models/Company';
import { CreateTicketDto, TicketDto } from './tickets.dto';
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

    if (type === TicketType.REGISTRATION_ADDRESS_CHANGE) {
      const existingTicket = await this.ticketModel.findOne({
        where: {
          companyId,
          type: TicketType.REGISTRATION_ADDRESS_CHANGE,
          status: TicketStatus.OPEN,
        },
      });

      if (existingTicket) {
        throw new ConflictException(
          `Already has a duplicate registrationAddressChange ticket`,
        );
      }
    }

    const category =
      type === TicketType.MANAGEMENT_REPORT
        ? TicketCategory.ACCOUNTING
        : TicketCategory.CORPORATE;

    let userRole =
      type === TicketType.MANAGEMENT_REPORT
        ? UserRole.ACCOUNTANT
        : UserRole.CORPORATE_SECRETARY;

    let assignees = await this.userModel.findAll({
      where: { companyId, role: userRole },
      order: [['createdAt', 'DESC']],
    });

    // If no corporate secretary found for registrationAddressChange, try to find a director
    if (type === TicketType.REGISTRATION_ADDRESS_CHANGE && !assignees.length) {
      userRole = UserRole.DIRECTOR;
      assignees = await this.userModel.findAll({
        where: { companyId, role: UserRole.DIRECTOR },
      });
    }

    if (!assignees.length) {
      throw new NotFoundException(
        `Cannot find user with role ${userRole} to create a ticket`,
      );
    }

    if (
      (userRole === UserRole.CORPORATE_SECRETARY ||
        userRole === UserRole.DIRECTOR) &&
      assignees.length > 1
    ) {
      throw new BadRequestException(
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
