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
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket)
    private ticketModel: typeof Ticket,
    @InjectModel(User)
    private userModel: typeof User,
    private sequelize: Sequelize,
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

    let category: TicketCategory;
    let userRole: UserRole;

    // Determine category and user role based on ticket type
    switch (type) {
      case TicketType.MANAGEMENT_REPORT:
        category = TicketCategory.ACCOUNTING;
        userRole = UserRole.ACCOUNTANT;
        break;
      case TicketType.REGISTRATION_ADDRESS_CHANGE:
        category = TicketCategory.CORPORATE;
        userRole = UserRole.CORPORATE_SECRETARY;
        break;
      case TicketType.STRIKE_OFF:
        category = TicketCategory.MANAGEMENT;
        userRole = UserRole.DIRECTOR;
        break;
      default:
        throw new BadRequestException(`Invalid ticket type`);
    }

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

    // Use transaction for strikeOff to ensure data consistency
    if (type === TicketType.STRIKE_OFF) {
      return await this.createStrikeOffTicket(companyId, assignee.id, category);
    }

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

  private async createStrikeOffTicket(
    companyId: number,
    assigneeId: number,
    category: TicketCategory,
  ): Promise<TicketDto> {
    const transaction = await this.sequelize.transaction();

    try {
      const ticket = await this.ticketModel.create(
        {
          companyId,
          assigneeId,
          category,
          type: TicketType.STRIKE_OFF,
          status: TicketStatus.OPEN,
        },
        { transaction },
      );

      // Resolve all other active tickets for this company
      await this.ticketModel.update(
        { status: TicketStatus.RESOLVED },
        {
          where: {
            companyId,
            status: TicketStatus.OPEN,
            id: { [Op.ne]: ticket.id }, // Exclude the newly created ticket
          },
          transaction,
        },
      );

      await transaction.commit();

      return {
        id: ticket.id,
        type: ticket.type,
        assigneeId: ticket.assigneeId,
        status: ticket.status,
        category: ticket.category,
        companyId: ticket.companyId,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
