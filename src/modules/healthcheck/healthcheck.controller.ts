import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthcheckService } from './healthcheck.service';

@ApiTags('healthcheck')
@Controller('healthcheck')
export class HealthcheckController {
  constructor(private readonly healthcheckService: HealthcheckService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Checks if the API and database connection are working properly',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The API and database are healthy',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Server error - The API or database connection is not working',
  })
  async ping() {
    await this.healthcheckService.ping();
    return {
      OK: true,
    };
  }
}
