import { Prisma } from '@prisma/client';
import { isBefore, isAfter } from 'date-fns'; // Optional for date utilities

export function taskMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    // Check if the operation involves the `Task` model
    if (params.model === 'Task' && (params.action === 'create' || params.action === 'update')) {
      const today = new Date();
      const data = params.args.data;

      // Calculate the `status` field dynamically
      if (data) {
        const { dueDate, completionDate } = data;

        let status = 'Pending';

        if (completionDate && isBefore(new Date(completionDate), today)) {
          status = 'Completed';
        } else if (dueDate && isAfter(new Date(dueDate), today)) {
          status = 'Pending';
        }

        // Ensure `status` is updated
        params.args.data.status = status;
      }
    }

    // Proceed with the query
    return next(params);
  };
}
