import { Controller, Post, Body, Get, Delete, NotFoundException, Param, HttpCode } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('comments')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ status: 201, description: 'Comment successfully created.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async create(@Body() createCommentDto: CreateCommentDto): Promise<Comment> {
    return this.commentService.create(createCommentDto);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get all comments for a task' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async findAll(@Param('taskId') taskId: string): Promise<Comment[]> {
    return this.commentService.findAll(parseInt(taskId));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment by id' })
  @ApiResponse({ status: 204, description: 'Comment successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    const deletedComment = await this.commentService.delete(parseInt(id));
    if (!deletedComment) {
      throw new NotFoundException(`Comment with id ${id} not found.`);
    }
  }
}




// @Controller('fields/:fieldId/tasks/:taskId/comments')
// export class CommentController {
//   constructor(private readonly commentService: CommentService) {}

//   @Get()
//   async findAllCommentsForTask(@Param('fieldId') fieldId: string, @Param('taskId') taskId: string) {
//     // Ensure task belongs to the field before fetching comments
//     const comments = await this.commentService.findAllByTaskIdAndFieldId(parseInt(fieldId), parseInt(taskId));
//     if (!comments.length) {
//       throw new NotFoundException(`No comments found for task ${taskId} in field ${fieldId}`);
//     }
//     return comments;
//   }

//   @Post()
//   async createComment(
//     @Param('fieldId') fieldId: string,
//     @Param('taskId') taskId: string,
//     @Body() createCommentDto: CreateCommentDto,
//   ) {
//     return this.commentService.createCommentForTaskAndField(parseInt(fieldId), parseInt(taskId), createCommentDto);
//   }

//   @Delete(':commentId')
//   async deleteComment(
//     @Param('fieldId') fieldId: string,
//     @Param('taskId') taskId: string,
//     @Param('commentId') commentId: string,
//   ) {
//     return this.commentService.deleteCommentForTaskAndField(parseInt(fieldId), parseInt(taskId), parseInt(commentId));
//   }
// }
