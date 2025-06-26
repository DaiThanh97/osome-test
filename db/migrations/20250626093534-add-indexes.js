'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add indexes to tickets table
    await queryInterface.addIndex('tickets', ['type'], {
      name: 'tickets_type_idx',
    });

    await queryInterface.addIndex('tickets', ['status'], {
      name: 'tickets_status_idx',
    });

    await queryInterface.addIndex('tickets', ['companyId'], {
      name: 'tickets_company_id_idx',
    });

    await queryInterface.addIndex('tickets', ['assigneeId'], {
      name: 'tickets_assignee_id_idx',
    });

    await queryInterface.addIndex('tickets', ['companyId', 'type', 'status'], {
      name: 'ticket_company_type_status_idx',
    });

    await queryInterface.addIndex('tickets', ['companyId', 'status'], {
      name: 'ticket_company_status_idx',
    });

    // Add indexes to users table
    await queryInterface.addIndex('users', ['role'], {
      name: 'users_role_idx',
    });

    await queryInterface.addIndex('users', ['companyId'], {
      name: 'users_company_id_idx',
    });

    await queryInterface.addIndex('users', ['companyId', 'role'], {
      name: 'user_company_role_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes from tickets table
    await queryInterface.removeIndex('tickets', 'tickets_type_idx');
    await queryInterface.removeIndex('tickets', 'tickets_status_idx');
    await queryInterface.removeIndex('tickets', 'tickets_company_id_idx');
    await queryInterface.removeIndex('tickets', 'tickets_assignee_id_idx');
    await queryInterface.removeIndex(
      'tickets',
      'ticket_company_type_status_idx',
    );
    await queryInterface.removeIndex('tickets', 'ticket_company_status_idx');

    // Remove indexes from users table
    await queryInterface.removeIndex('users', 'users_role_idx');
    await queryInterface.removeIndex('users', 'users_company_id_idx');
    await queryInterface.removeIndex('users', 'user_company_role_idx');
  },
};
