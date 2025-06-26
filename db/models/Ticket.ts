import {
  Table,
  Column,
  Model,
  BelongsTo,
  ForeignKey,
  PrimaryKey,
  AutoIncrement,
  Index,
} from 'sequelize-typescript';
import { Company } from './Company';
import { User } from './User';
import { TicketStatus, TicketType, TicketCategory } from '../enums';

@Table({
  tableName: 'tickets',
  indexes: [
    {
      name: 'ticket_company_type_status_idx',
      fields: ['companyId', 'type', 'status'],
    },
    {
      name: 'ticket_company_status_idx',
      fields: ['companyId', 'status'],
    },
  ],
})
export class Ticket extends Model {
  @AutoIncrement
  @PrimaryKey
  @Column
  declare id: number;

  @Index
  @Column
  declare type: TicketType;

  @Index
  @Column
  declare status: TicketStatus;

  @Column
  declare category: TicketCategory;

  @Index
  @ForeignKey(() => Company)
  declare companyId: number;

  @Index
  @ForeignKey(() => User)
  declare assigneeId: number;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => User)
  assignee: User;
}
