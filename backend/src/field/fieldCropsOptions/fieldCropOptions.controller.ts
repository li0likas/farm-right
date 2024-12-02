import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { FieldCropOptionsService } from './fieldCropOptions.service';

@Controller('field-crop-options')
export class FieldCropOptionsController {
  constructor(private readonly fieldCropOptionService: FieldCropOptionsService) {}
  @Get()
  async getFieldCropOptions(@Res() res: Response) {
    try {
        const cropOptions = await this.fieldCropOptionService.getFieldCropOptions();
        res.status(200).json(cropOptions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching crop options', error });
    }
  }
}