import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { Ticket } from '@db/models/Ticket';
import { User } from '@db/models/User';
import { Company } from '@db/models/Company';
import { getModelToken } from '@nestjs/sequelize';
import { TicketType, TicketStatus, TicketCategory, UserRole } from '@db/enums';
import { CreateTicketDto } from './tickets.dto';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { CompaniesService } from '../companies/companies.service';

describe('TicketsService', () => {
  let service: TicketsService;

  // Mock data
  const mockCompany = { id: 1, name: 'Test Company' };

  const mockUsers = [
    {
      id: 1,
      name: 'Accountant User',
      role: UserRole.ACCOUNTANT,
      companyId: 1,
      createdAt: new Date('2023-01-01'),
      company: mockCompany,
    },
    {
      id: 2,
      name: 'Secretary User',
      role: UserRole.CORPORATE_SECRETARY,
      companyId: 1,
      createdAt: new Date('2023-01-02'),
      company: mockCompany,
    },
    {
      id: 3,
      name: 'Director User',
      role: UserRole.DIRECTOR,
      companyId: 1,
      createdAt: new Date('2023-01-03'),
      company: mockCompany,
    },
  ];

  const mockTickets = [
    {
      id: 1,
      type: TicketType.MANAGEMENT_REPORT,
      companyId: 1,
      assigneeId: 1,
      status: TicketStatus.OPEN,
      category: TicketCategory.ACCOUNTING,
      company: mockCompany,
      assignee: mockUsers[0],
    },
    {
      id: 2,
      type: TicketType.REGISTRATION_ADDRESS_CHANGE,
      companyId: 2,
      assigneeId: 2,
      status: TicketStatus.OPEN,
      category: TicketCategory.CORPORATE,
      company: { id: 2, name: 'Another Company' },
      assignee: mockUsers[1],
    },
  ];

  // Mock repositories
  const ticketRepositoryMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const userRepositoryMock = {
    findAll: jest.fn(),
  };

  const companiesServiceMock = {
    findById: jest.fn(),
  };

  const sequelizeMock = {
    transaction: jest.fn().mockImplementation(() => ({
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getModelToken(Ticket),
          useValue: ticketRepositoryMock,
        },
        {
          provide: getModelToken(User),
          useValue: userRepositoryMock,
        },
        {
          provide: Sequelize,
          useValue: sequelizeMock,
        },
        {
          provide: CompaniesService,
          useValue: companiesServiceMock,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  describe('findAll', () => {
    it('should return all tickets with company and user details', async () => {
      // Arrange
      ticketRepositoryMock.findAll.mockResolvedValue(mockTickets);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(mockTickets);
      expect(ticketRepositoryMock.findAll).toHaveBeenCalledWith({
        include: [Company, User],
      });
    });
  });

  describe('create', () => {
    beforeEach(() => {
      // Default mock for company service to return a valid company
      companiesServiceMock.findById.mockResolvedValue(mockCompany);
    });

    describe('managementReport ticket', () => {
      it('should create a managementReport ticket with the most recent accountant as assignee', async () => {
        // Arrange
        const createTicketDto: CreateTicketDto = {
          type: TicketType.MANAGEMENT_REPORT,
          companyId: 1,
        };

        const accountants = [
          { ...mockUsers[0], id: 4, createdAt: new Date('2023-01-15') },
          { ...mockUsers[0], createdAt: new Date('2023-01-10') },
        ];

        userRepositoryMock.findAll.mockResolvedValue(accountants);

        const createdTicket = {
          id: 3,
          ...createTicketDto,
          assigneeId: 4,
          category: TicketCategory.ACCOUNTING,
          status: TicketStatus.OPEN,
        };

        ticketRepositoryMock.create.mockResolvedValue(createdTicket);

        // Act
        const result = await service.create(createTicketDto);

        // Assert
        expect(result).toEqual(createdTicket);
        expect(companiesServiceMock.findById).toHaveBeenCalledWith(1);
        expect(userRepositoryMock.findAll).toHaveBeenCalledWith({
          where: { companyId: 1, role: UserRole.ACCOUNTANT },
          order: [['createdAt', 'DESC']],
        });
        expect(ticketRepositoryMock.create).toHaveBeenCalledWith({
          companyId: 1,
          assigneeId: 4,
          category: TicketCategory.ACCOUNTING,
          type: TicketType.MANAGEMENT_REPORT,
          status: TicketStatus.OPEN,
        });
      });

      it('should throw NotFoundException when no accountant is found', async () => {
        // Arrange
        const createTicketDto: CreateTicketDto = {
          type: TicketType.MANAGEMENT_REPORT,
          companyId: 1,
        };

        userRepositoryMock.findAll.mockResolvedValue([]);

        // Act & Assert
        await expect(service.create(createTicketDto)).rejects.toThrow(
          new NotFoundException(
            `Cannot find user with role ${UserRole.ACCOUNTANT} to create a ticket`,
          ),
        );

        expect(companiesServiceMock.findById).toHaveBeenCalledWith(1);
        expect(userRepositoryMock.findAll).toHaveBeenCalledWith({
          where: { companyId: 1, role: UserRole.ACCOUNTANT },
          order: [['createdAt', 'DESC']],
        });
        expect(ticketRepositoryMock.create).not.toHaveBeenCalled();
      });

      it('should throw NotFoundException when company is not found', async () => {
        // Arrange
        const createTicketDto: CreateTicketDto = {
          type: TicketType.MANAGEMENT_REPORT,
          companyId: 999,
        };

        companiesServiceMock.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(service.create(createTicketDto)).rejects.toThrow(
          new NotFoundException('Company not found'),
        );

        expect(companiesServiceMock.findById).toHaveBeenCalledWith(999);
        expect(userRepositoryMock.findAll).not.toHaveBeenCalled();
        expect(ticketRepositoryMock.create).not.toHaveBeenCalled();
      });
    });

    describe('registrationAddressChange ticket', () => {
      it('should create a registrationAddressChange ticket with corporate secretary as assignee', async () => {
        // Arrange
        const createTicketDto: CreateTicketDto = {
          type: TicketType.REGISTRATION_ADDRESS_CHANGE,
          companyId: 1,
        };

        ticketRepositoryMock.findOne.mockResolvedValue(null);
        userRepositoryMock.findAll.mockResolvedValue([mockUsers[1]]);

        const createdTicket = {
          id: 3,
          ...createTicketDto,
          assigneeId: 2,
          category: TicketCategory.CORPORATE,
          status: TicketStatus.OPEN,
        };

        ticketRepositoryMock.create.mockResolvedValue(createdTicket);

        // Act
        const result = await service.create(createTicketDto);

        // Assert
        expect(result).toEqual(createdTicket);
        expect(companiesServiceMock.findById).toHaveBeenCalledWith(1);
        expect(ticketRepositoryMock.findOne).toHaveBeenCalledWith({
          where: {
            companyId: 1,
            type: TicketType.REGISTRATION_ADDRESS_CHANGE,
            status: TicketStatus.OPEN,
          },
        });
        expect(userRepositoryMock.findAll).toHaveBeenCalledWith({
          where: { companyId: 1, role: UserRole.CORPORATE_SECRETARY },
          order: [['createdAt', 'DESC']],
        });
        expect(ticketRepositoryMock.create).toHaveBeenCalledWith({
          companyId: 1,
          assigneeId: 2,
          category: TicketCategory.CORPORATE,
          type: TicketType.REGISTRATION_ADDRESS_CHANGE,
          status: TicketStatus.OPEN,
        });
      });

      it('should throw ConflictException when a duplicate registrationAddressChange ticket exists', async () => {
        // Arrange
        const createTicketDto: CreateTicketDto = {
          type: TicketType.REGISTRATION_ADDRESS_CHANGE,
          companyId: 1,
        };

        ticketRepositoryMock.findOne.mockResolvedValue({ id: 5 });

        // Act & Assert
        await expect(service.create(createTicketDto)).rejects.toThrow(
          new ConflictException(
            'Already has a duplicate registrationAddressChange ticket',
          ),
        );

        expect(companiesServiceMock.findById).toHaveBeenCalledWith(1);
        expect(ticketRepositoryMock.findOne).toHaveBeenCalledWith({
          where: {
            companyId: 1,
            type: TicketType.REGISTRATION_ADDRESS_CHANGE,
            status: TicketStatus.OPEN,
          },
        });
        expect(userRepositoryMock.findAll).not.toHaveBeenCalled();
        expect(ticketRepositoryMock.create).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException when multiple corporate secretaries exist', async () => {
        // Arrange
        const createTicketDto: CreateTicketDto = {
          type: TicketType.REGISTRATION_ADDRESS_CHANGE,
          companyId: 1,
        };

        ticketRepositoryMock.findOne.mockResolvedValue(null);
        userRepositoryMock.findAll.mockResolvedValue([
          mockUsers[1],
          { ...mockUsers[1], id: 4 },
        ]);

        // Act & Assert
        await expect(service.create(createTicketDto)).rejects.toThrow(
          new BadRequestException(
            `Multiple users with role ${UserRole.CORPORATE_SECRETARY}. Cannot create a ticket`,
          ),
        );

        expect(companiesServiceMock.findById).toHaveBeenCalledWith(1);
        expect(ticketRepositoryMock.findOne).toHaveBeenCalled();
        expect(userRepositoryMock.findAll).toHaveBeenCalled();
        expect(ticketRepositoryMock.create).not.toHaveBeenCalled();
      });

      it('should use Director as assignee when no corporate secretary is found', async () => {
        // Arrange
        const createTicketDto: CreateTicketDto = {
          type: TicketType.REGISTRATION_ADDRESS_CHANGE,
          companyId: 1,
        };

        ticketRepositoryMock.findOne.mockResolvedValue(null);

        // First call returns empty array (no corporate secretary)
        // Second call returns a director
        userRepositoryMock.findAll
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([mockUsers[2]]);

        const createdTicket = {
          id: 3,
          ...createTicketDto,
          assigneeId: 3,
          category: TicketCategory.CORPORATE,
          status: TicketStatus.OPEN,
        };

        ticketRepositoryMock.create.mockResolvedValue(createdTicket);

        // Act
        const result = await service.create(createTicketDto);

        // Assert
        expect(result).toEqual(createdTicket);
        expect(companiesServiceMock.findById).toHaveBeenCalledWith(1);
        expect(userRepositoryMock.findAll).toHaveBeenCalledTimes(2);
        expect(userRepositoryMock.findAll).toHaveBeenNthCalledWith(1, {
          where: { companyId: 1, role: UserRole.CORPORATE_SECRETARY },
          order: [['createdAt', 'DESC']],
        });
        expect(userRepositoryMock.findAll).toHaveBeenNthCalledWith(2, {
          where: { companyId: 1, role: UserRole.DIRECTOR },
        });
        expect(ticketRepositoryMock.create).toHaveBeenCalled();
      });

      it('should throw NotFoundException when neither corporate secretary nor director is found', async () => {
        // Arrange
        const createTicketDto: CreateTicketDto = {
          type: TicketType.REGISTRATION_ADDRESS_CHANGE,
          companyId: 1,
        };

        ticketRepositoryMock.findOne.mockResolvedValue(null);
        userRepositoryMock.findAll.mockResolvedValue([]);

        // Act & Assert
        await expect(service.create(createTicketDto)).rejects.toThrow(
          new NotFoundException(
            `Cannot find user with role ${UserRole.DIRECTOR} to create a ticket`,
          ),
        );

        expect(companiesServiceMock.findById).toHaveBeenCalledWith(1);
        expect(ticketRepositoryMock.findOne).toHaveBeenCalled();
        expect(userRepositoryMock.findAll).toHaveBeenCalledTimes(2);
        expect(ticketRepositoryMock.create).not.toHaveBeenCalled();
      });
    });

    describe('strikeOff ticket', () => {
      it('should create a strikeOff ticket and resolve all other tickets for the company', async () => {
        // Arrange
        const createTicketDto: CreateTicketDto = {
          type: TicketType.STRIKE_OFF,
          companyId: 1,
        };

        userRepositoryMock.findAll.mockResolvedValue([mockUsers[2]]);

        const createdTicket = {
          id: 3,
          ...createTicketDto,
          assigneeId: 3,
          category: TicketCategory.MANAGEMENT,
          status: TicketStatus.OPEN,
        };

        ticketRepositoryMock.create.mockResolvedValue(createdTicket);
        ticketRepositoryMock.update.mockResolvedValue([1]);

        const transactionMock = {
          commit: jest.fn().mockResolvedValue(undefined),
          rollback: jest.fn().mockResolvedValue(undefined),
        };

        sequelizeMock.transaction.mockResolvedValue(transactionMock);

        // Act
        const result = await service.create(createTicketDto);

        // Assert
        expect(result).toEqual(createdTicket);
        expect(companiesServiceMock.findById).toHaveBeenCalledWith(1);
        expect(userRepositoryMock.findAll).toHaveBeenCalledWith({
          where: { companyId: 1, role: UserRole.DIRECTOR },
          order: [['createdAt', 'DESC']],
        });
        expect(sequelizeMock.transaction).toHaveBeenCalled();
        expect(ticketRepositoryMock.create).toHaveBeenCalledWith(
          {
            companyId: 1,
            assigneeId: 3,
            category: TicketCategory.MANAGEMENT,
            type: TicketType.STRIKE_OFF,
            status: TicketStatus.OPEN,
          },
          { transaction: transactionMock },
        );
        expect(ticketRepositoryMock.update).toHaveBeenCalledWith(
          { status: TicketStatus.RESOLVED },
          {
            where: {
              companyId: 1,
              status: TicketStatus.OPEN,
              id: { [Op.ne]: 3 },
            },
            transaction: transactionMock,
          },
        );
        expect(transactionMock.commit).toHaveBeenCalled();
        expect(transactionMock.rollback).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException when multiple directors exist', async () => {
        // Arrange
        const createTicketDto: CreateTicketDto = {
          type: TicketType.STRIKE_OFF,
          companyId: 1,
        };

        userRepositoryMock.findAll.mockResolvedValue([
          mockUsers[2],
          { ...mockUsers[2], id: 4 },
        ]);

        // Act & Assert
        await expect(service.create(createTicketDto)).rejects.toThrow(
          new BadRequestException(
            `Multiple users with role ${UserRole.DIRECTOR}. Cannot create a ticket`,
          ),
        );

        expect(companiesServiceMock.findById).toHaveBeenCalledWith(1);
        expect(userRepositoryMock.findAll).toHaveBeenCalled();
        expect(sequelizeMock.transaction).not.toHaveBeenCalled();
        expect(ticketRepositoryMock.create).not.toHaveBeenCalled();
      });

      it('should rollback transaction when an error occurs during strikeOff creation', async () => {
        // Arrange
        const createTicketDto: CreateTicketDto = {
          type: TicketType.STRIKE_OFF,
          companyId: 1,
        };

        userRepositoryMock.findAll.mockResolvedValue([mockUsers[2]]);

        const error = new Error('Database error');
        ticketRepositoryMock.create.mockRejectedValue(error);

        const transactionMock = {
          commit: jest.fn().mockResolvedValue(undefined),
          rollback: jest.fn().mockResolvedValue(undefined),
        };

        sequelizeMock.transaction.mockResolvedValue(transactionMock);

        // Act & Assert
        await expect(service.create(createTicketDto)).rejects.toThrow(error);

        expect(companiesServiceMock.findById).toHaveBeenCalledWith(1);
        expect(userRepositoryMock.findAll).toHaveBeenCalled();
        expect(sequelizeMock.transaction).toHaveBeenCalled();
        expect(ticketRepositoryMock.create).toHaveBeenCalled();
        expect(transactionMock.commit).not.toHaveBeenCalled();
        expect(transactionMock.rollback).toHaveBeenCalled();
      });
    });

    it('should throw BadRequestException for invalid ticket type', async () => {
      // Arrange
      const createTicketDto: CreateTicketDto = {
        type: 'invalidType' as TicketType,
        companyId: 1,
      };

      // Act & Assert
      await expect(service.create(createTicketDto)).rejects.toThrow(
        new BadRequestException('Invalid ticket type'),
      );

      expect(companiesServiceMock.findById).toHaveBeenCalledWith(1);
      expect(userRepositoryMock.findAll).not.toHaveBeenCalled();
      expect(ticketRepositoryMock.create).not.toHaveBeenCalled();
    });
  });
});
