import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { CreateTicketDto, TicketDto } from './tickets.dto';
import { TicketType, TicketStatus, TicketCategory } from '@db/enums';

describe('TicketsController', () => {
  let controller: TicketsController;

  // Mock data
  const mockTickets: TicketDto[] = [
    {
      id: 1,
      type: TicketType.MANAGEMENT_REPORT,
      companyId: 1,
      assigneeId: 1,
      status: TicketStatus.OPEN,
      category: TicketCategory.ACCOUNTING,
    },
    {
      id: 2,
      type: TicketType.REGISTRATION_ADDRESS_CHANGE,
      companyId: 2,
      assigneeId: 2,
      status: TicketStatus.OPEN,
      category: TicketCategory.CORPORATE,
    },
  ];

  const mockTicket: TicketDto = {
    id: 3,
    type: TicketType.MANAGEMENT_REPORT,
    companyId: 1,
    assigneeId: 1,
    status: TicketStatus.OPEN,
    category: TicketCategory.ACCOUNTING,
  };

  const mockStrikeOffTicket: TicketDto = {
    id: 4,
    type: TicketType.STRIKE_OFF,
    companyId: 1,
    assigneeId: 3,
    status: TicketStatus.OPEN,
    category: TicketCategory.MANAGEMENT,
  };

  // Create mock service
  const mockTicketsService = {
    findAll: jest.fn().mockResolvedValue(mockTickets),
    create: jest.fn().mockResolvedValue(mockTicket),
  };

  beforeEach(async () => {
    // Reset mock calls before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: mockTicketsService,
        },
      ],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
  });

  describe('findAll', () => {
    it('should return an array of tickets', async () => {
      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual(mockTickets);
      expect(mockTicketsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    const createTicketDto: CreateTicketDto = {
      type: TicketType.MANAGEMENT_REPORT,
      companyId: 1,
    };

    it('should create a new ticket successfully', async () => {
      // Act
      const result = await controller.create(createTicketDto);

      // Assert
      expect(result).toEqual(mockTicket);
      expect(mockTicketsService.create).toHaveBeenCalledTimes(1);
      expect(mockTicketsService.create).toHaveBeenCalledWith(createTicketDto);
    });

    it('should create a strikeOff ticket and resolve other tickets', async () => {
      // Arrange
      const strikeOffTicketDto: CreateTicketDto = {
        type: TicketType.STRIKE_OFF,
        companyId: 1,
      };

      mockTicketsService.create.mockResolvedValueOnce(mockStrikeOffTicket);

      // Act
      const result = await controller.create(strikeOffTicketDto);

      // Assert
      expect(result).toEqual(mockStrikeOffTicket);
      expect(mockTicketsService.create).toHaveBeenCalledTimes(1);
      expect(mockTicketsService.create).toHaveBeenCalledWith(
        strikeOffTicketDto,
      );
    });
  });
});
