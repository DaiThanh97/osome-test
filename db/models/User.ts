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
import { UserRole } from '../enums';

@Table({
  tableName: 'users',
  indexes: [
    {
      name: 'user_company_role_idx',
      fields: ['companyId', 'role'],
    },
  ],
})
export class User extends Model {
  @AutoIncrement
  @PrimaryKey
  @Column
  declare id: number;

  @Column
  declare name: string;

  @Index
  @Column
  declare role: UserRole;

  @Index
  @ForeignKey(() => Company)
  declare companyId: number;

  @BelongsTo(() => Company)
  company: Company;
}
