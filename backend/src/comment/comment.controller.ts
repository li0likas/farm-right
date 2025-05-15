// import { Controller, Post, Body, Get, Delete, NotFoundException, Param, HttpCode, UseGuards, Request } from '@nestjs/common';
// import { CommentService } from './comment.service';
// import { CreateCommentDto } from './dto/create-comment.dto';
// import { Comment } from '@prisma/client';
// import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
// import { AuthGuard } from '@nestjs/passport';
// import { PermissionsGuard } from '../guards/permissions.guard';
// import { Permissions } from '../decorators/permissions.decorator';

// @UseGuards(AuthGuard('jwt'), PermissionsGuard)
// @ApiTags('comments')
// @Controller('comments')
// export class CommentController {
//   constructor(private readonly commentService: CommentService) {}

//   @Post()
//   @Permissions('COMMENT_CREATE')
//   @ApiOperation({ summary: 'Create a new comment' })
//   @ApiResponse({ status: 201, description: 'Comment successfully created.' })
//   @ApiResponse({ status: 404, description: 'Task not found.' })
//   async create(@Request() req, @Body() createCommentDto: CreateCommentDto): Promise<Comment> {
//     const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
//     if (isNaN(farmId)) {
//       throw new NotFoundException('Invalid farm ID.');
//     }
  
//     return this.commentService.create(
//       createCommentDto,
//       farmId
//     );
//   }

//   @Get(':taskId')
//   @Permissions('COMMENT_READ')
//   @ApiOperation({ summary: 'Get all comments for a task' })
//   @ApiResponse({ status: 200, description: 'Comments retrieved successfully.' })
//   @ApiResponse({ status: 404, description: 'Task not found.' })
//   async findAll(@Request() req, @Param('taskId') taskId: string): Promise<Comment[]> {
//     const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
//     if (isNaN(farmId)) {
//       throw new NotFoundException('Invalid farm ID.');
//     }
  
//     return this.commentService.findAll(
//       parseInt(taskId),
//       farmId
//     );
//   }

//   @Delete(':id')
//   @Permissions('COMMENT_DELETE')
//   @ApiOperation({ summary: 'Delete a comment by id' })
//   @ApiResponse({ status: 204, description: 'Comment successfully deleted.' })
//   @ApiResponse({ status: 404, description: 'Comment not found.' })
//   @HttpCode(204)
//   async delete(@Request() req, @Param('id') id: string): Promise<void> {
//     const farmId = parseInt(req.headers['x-selected-farm-id'], 10); // Extract farmId
//     if (isNaN(farmId)) {
//       throw new NotFoundException('Invalid farm ID.');
//     }

//     await this.commentService.delete(parseInt(id), farmId);
//   }
// }