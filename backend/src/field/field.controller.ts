import { Controller, Post, Body, Get, Param, Put, Delete, NotFoundException, BadRequestException } from '@nestjs/common';
import { FieldService } from './field.service';
import { CommentService } from '../comment/comment.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { CreateCommentDto } from '../comment/dto/create-comment.dto';
import { FieldResponseDto } from './dto/field-response.dto';
import { Field } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('fields')
@Controller('fields')
export class FieldController {
  constructor(private readonly fieldsService: FieldService,     private readonly commentService: CommentService, // Inject the CommentService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new field' })
  @ApiResponse({ status: 201, description: 'The field has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Body() createFieldDto: CreateFieldDto): Promise<Field> {
    return this.fieldsService.create(createFieldDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all fields' })
  @ApiResponse({ status: 200, description: 'The fields have been successfully retrieved.', type: [FieldResponseDto] })
  async findAll(): Promise<Field[]> {
    return this.fieldsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a field by id' })
  @ApiResponse({ status: 200, description: 'The field has been successfully retrieved.', type: FieldResponseDto })
  @ApiResponse({ status: 404, description: 'Field not found.' })
  async findOne(@Param('id') id: string): Promise<FieldResponseDto> {
    const field = await this.fieldsService.findOne(parseInt(id));
    if (!field) {
      throw new NotFoundException(`Field with id ${id} not found`);
    }
    return field;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a field by id' })
  @ApiResponse({ status: 200, description: 'The field has been successfully updated.', type: FieldResponseDto })
  @ApiResponse({ status: 404, description: 'Field not found.' })
  async update(@Param('id') id: string, @Body() field: Partial<Field>): Promise<Field> {
    return this.fieldsService.update(parseInt(id), field);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a field by id' })
  @ApiResponse({ status: 200, description: 'The field has been successfully deleted.', type: FieldResponseDto })
  @ApiResponse({ status: 404, description: 'Field not found.' })
  async delete(@Param('id') id: string): Promise<FieldResponseDto> {
    const deletedField = await this.fieldsService.delete(parseInt(id));
    if (deletedField == null) {
      throw new NotFoundException(`Field with id ${id} not found`);
    }
    return deletedField;
  }

  // @Get(':id/tasks/:taskId/comments')
  // async findAllCommentsForTask(@Param('fieldId') fieldId: string, @Param('taskId') taskId: string) {
  //   const comments = await this.commentService.findAllByTaskIdAndFieldId(parseInt(fieldId), parseInt(taskId));
  //   if (!comments.length) {
  //     throw new NotFoundException(`No comments found for task ${taskId} in field ${fieldId}`);
  //   }
  //   return comments;
  // }

  @Get(':id/tasks/:taskId/comments')
  async findAllCommentsForTask(
    @Param('id') fieldId: string,
    @Param('taskId') taskId: string
  ) {
    const parsedFieldId = parseInt(fieldId);
    const parsedTaskId = parseInt(taskId);

    // Validate that both IDs are valid numbers
    if (isNaN(parsedFieldId) || isNaN(parsedTaskId)) {
      throw new BadRequestException('Invalid fieldId or taskId provided.');
    }

    const comments = await this.commentService.findAllByTaskIdAndFieldId(parsedFieldId, parsedTaskId);

    if (!comments.length) {
      throw new NotFoundException(`No comments found for task ${taskId} in field ${fieldId}`);
    }

    return comments;
  }


  @Post(':id/tasks/:taskId/comments')
  async createComment(
    @Param('fieldId') fieldId: string,
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentService.createCommentForTaskAndField(parseInt(fieldId), parseInt(taskId), createCommentDto);
  }

  @Delete(':id/tasks/:taskId/comments')
  async deleteComment(
    @Param('fieldId') fieldId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.commentService.deleteCommentForTaskAndField(parseInt(fieldId), parseInt(taskId), parseInt(commentId));
  }

}


